import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const baseUrl = (
  process.env.API_BASE_URL ?? 'http://127.0.0.1:3000/api/v1'
).replace(/\/$/, '');
// Keep headroom below the global 120 requests/minute limit so this probe can
// coexist with readiness checks and normal staging traffic.
const requestCount = Number(process.env.LOAD_REQUEST_COUNT ?? '50');
const concurrency = Number(process.env.LOAD_CONCURRENCY ?? '10');
const p95TargetMs = Number(process.env.LOAD_P95_TARGET_MS ?? '300');

function assertPositiveInteger(value: number, name: string): void {
  assert(Number.isInteger(value) && value > 0, `${name} must be positive`);
}

async function request(
  path: string,
): Promise<{ response: Response; ms: number }> {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-request-id': randomUUID() },
  });
  return { response, ms: performance.now() - startedAt };
}

async function verifySecurityHeaders(): Promise<void> {
  const { response } = await request('/health/live');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/i);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(
    response.headers.get('content-security-policy') ?? '',
    /frame-ancestors 'none'/,
  );

  const readiness = await request('/health/ready');
  assert.equal(readiness.response.status, 200);
  assert.deepEqual(await readiness.response.json(), {
    status: 'ready',
    database: 'up',
  });
}

async function runReadLoad(): Promise<void> {
  const timings: number[] = [];
  let nextRequest = 0;

  async function worker(): Promise<void> {
    while (nextRequest < requestCount) {
      nextRequest += 1;
      const { response, ms } = await request('/products?limit=24');
      assert.equal(response.status, 200);
      await response.arrayBuffer();
      timings.push(ms);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, requestCount) }, () => worker()),
  );
  timings.sort((left, right) => left - right);
  const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
  const average =
    timings.reduce((sum, value) => sum + value, 0) / timings.length;
  assert(
    p95 < p95TargetMs,
    `Catalog p95 ${p95.toFixed(2)}ms exceeds ${p95TargetMs}ms target`,
  );
  console.info(
    JSON.stringify({
      event: 'http_smoke_completed',
      requests: timings.length,
      concurrency,
      averageMs: Number(average.toFixed(2)),
      p95Ms: Number(p95.toFixed(2)),
      targetMs: p95TargetMs,
    }),
  );
}

async function main(): Promise<void> {
  assertPositiveInteger(requestCount, 'LOAD_REQUEST_COUNT');
  assertPositiveInteger(concurrency, 'LOAD_CONCURRENCY');
  assertPositiveInteger(p95TargetMs, 'LOAD_P95_TARGET_MS');
  await verifySecurityHeaders();
  await runReadLoad();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
