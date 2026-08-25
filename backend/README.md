# Burhanpedia API and worker

The backend is a standalone NestJS project containing the HTTP API, a separate worker entry point, PostgreSQL migrations, seed data, and operational checks. It can be installed, tested, and built without the frontend.

## Architecture

Feature modules in `src/modules/` separate HTTP presentation, application services, domain rules, and SQL repositories. Controllers validate input and expose `/api/v1` endpoints; services enforce workflows; repositories own PostgreSQL queries. `src/database/` provides the connection pool and transaction helper. The API and worker share the database schema but run as separate processes.

| Module | Responsibility |
| --- | --- |
| `identity` | Registration, cookie-based sessions, rotating refresh tokens, active roles, and audit records. |
| `catalog` | Public search and discovery, stores, variants, inventory, and seller product management. |
| `storage` | Signed S3-compatible uploads and image validation before publication. |
| `commerce` | Server-side cart, deterministic pricing, wallet ledger, vouchers, checkout, and order creation. |
| `operations` | Seller order processing, driver assignment and delivery states, admin operations, and time controls for development. |
| `reviews` | Verified buyer reviews and rating summaries. |

HTTP authorization is enforced by backend guards and ownership checks, independently of what the frontend shows. The API uses validated DTOs, rate limiting, CORS, secure HTTP headers, request IDs, structured request logs, and a consistent Problem Details error response.

### Data and background processing

Versioned SQL files in `database/migrations/` create and evolve the PostgreSQL schema. `npm run db:migrate` records filenames and SHA-256 checksums in `schema_migrations` under an advisory lock; unchanged migrations are skipped and modified applied migrations are rejected. Repositories use `pg` directly, with parameterized queries and transaction helpers. Checkout calculates totals on the server, locks the relevant state, writes per-store orders and ledger entries atomically, and uses an idempotency key to prevent duplicate checkout on retry.

The worker entry point is `src/worker.ts`. It claims database-backed jobs and outbox events with `FOR UPDATE SKIP LOCKED`, processes overdue order return/refund work, retries failures, and records exhausted attempts in a dead-letter table. Run only the API for HTTP traffic; run the worker separately when scheduled processing is required.

## Local setup

Use Node.js 22–24 and Docker Compose. Copy `.env.example` to `.env` and review `DATABASE_URL` before every migration, seed, reset, or test command. The default Compose file provides PostgreSQL and optional MinIO with persistent local volumes.

```bash
docker compose up -d --wait postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

The API listens at `http://localhost:3000/api/v1` by default. In another terminal, run `npm run worker:dev` to start background processing. To use seller image uploads, start object storage:

```bash
docker compose up -d --wait minio minio-init
npm run smoke:storage
```

Configure the `S3_*` variables from `.env.example`. Uploads use signed URLs; the API checks the resulting object's size, checksum, format, and dimensions before publication. `npm run db:seed:demo` adds a larger, repeatable demonstration dataset on top of the development seed; it is not production data.

## Configuration and verification

The key environment groups in `.env.example` are `DATABASE_*` for PostgreSQL, `JWT_*` and `COOKIE_SECURE` for sessions, `FRONTEND_URL` and `ADDITIONAL_ORIGINS` for browser access, and `S3_*` for images. Production configuration rejects missing required secrets. Keep credentials outside version control.

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run audit:dead-code
npm run audit:dependencies
```

Database and HTTP integration tests require a dedicated PostgreSQL test database. `npm run test:e2e` runs backend endpoint tests; `npm run db:verify` checks schema and seed invariants. The [integration CI workflow](../.github/workflows/integration-ci.yml) shows the combined test setup. Never run seed, reset, benchmark, or test commands against a production database.

## Production runtime and limitations

Run migrations as a separate deployment job using a direct PostgreSQL connection. Deploy the built API with `npm run start:prod` and the worker with `npm run worker`. Configure secure cookies, a strong JWT secret, the public frontend origin, PostgreSQL backups, and S3-compatible image storage. Rehearse restore and rollback before release.

Development wallet top-up and simulated time are disabled in production. There is no production funding or payment integration, so this backend must not be used for public paid checkout until that capability is implemented and verified.
