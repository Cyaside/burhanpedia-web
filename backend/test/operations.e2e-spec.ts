import { randomUUID } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { IdentityService } from '../src/modules/identity/application/identity.service';
import { AppRole } from '../src/modules/identity/domain/identity.types';
import { WorkerProcessor } from '../src/worker/worker.processor';
import { WorkerModule } from '../src/worker/worker.module';

describe('seller delivery and overdue worker', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let identity: IdentityService;
  let worker: WorkerProcessor;
  const origin = 'http://localhost:3001';
  const suffix = Date.now().toString(36);
  const password = 'VerySecurePassword123!';
  let sellerCookie: string;
  let storeId: string;
  let variantId: string;
  let buyer: { cookie: string; addressId: string };
  const driverCookies: string[] = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule, WorkerModule],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    database = app.get(DatabaseService);
    identity = app.get(IdentityService);
    worker = app.get(WorkerProcessor);
    ({ sellerCookie, storeId, variantId } = await createCatalog());
    buyer = await createBuyer();
    driverCookies.push(
      await createUser('driver-left', AppRole.DRIVER),
      await createUser('driver-right', AppRole.DRIVER),
    );
    await createUser('admin', AppRole.ADMIN);
  }, 30_000);

  afterAll(async () => app.close());

  it('enforces one driver claim and records the complete state history', async () => {
    const order = await checkout('delivery-flow', 'INSTANT');
    await process(order.id);
    const jobs = await request(app.getHttpServer())
      .get('/api/v1/driver/jobs')
      .set('Cookie', driverCookies[0])
      .expect(200);
    const job = jobs.body.data.find(
      (candidate: { orderId: string }) => candidate.orderId === order.id,
    );
    expect(job).toBeDefined();

    const claims = await Promise.all(
      driverCookies.map((cookie, index) =>
        request(app.getHttpServer())
          .post(`/api/v1/driver/jobs/${job.id as string}/claim`)
          .set('origin', origin)
          .set('Cookie', cookie)
          .set('Idempotency-Key', `claim-${suffix}-${index}`),
      ),
    );
    expect(claims.map(({ status }) => status).sort()).toEqual([201, 409]);
    const winner = claims.findIndex(({ status }) => status === 201);
    const deliveryId = claims[winner].body.delivery_id as string;

    const claimed = await request(app.getHttpServer())
      .get('/api/v1/driver/deliveries')
      .set('Cookie', driverCookies[winner])
      .expect(200);
    expect(claimed.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: deliveryId, status: 'CLAIMED' }),
      ]),
    );
    const otherDriver = await request(app.getHttpServer())
      .get('/api/v1/driver/deliveries')
      .set('Cookie', driverCookies[1 - winner])
      .expect(200);
    expect(otherDriver.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: deliveryId })]),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/driver/deliveries/${deliveryId}/pickup`)
      .set('origin', origin)
      .set('Cookie', driverCookies[winner])
      .expect(201);
    const delivered = await request(app.getHttpServer())
      .post(`/api/v1/driver/deliveries/${deliveryId}/complete`)
      .set('origin', origin)
      .set('Cookie', driverCookies[winner])
      .expect(201);
    expect(delivered.body.earningAmount).toBe('20000');
    const retry = await request(app.getHttpServer())
      .post(`/api/v1/driver/deliveries/${deliveryId}/complete`)
      .set('origin', origin)
      .set('Cookie', driverCookies[winner])
      .expect(201);
    expect(retry.body.earningAmount).toBe('20000');

    const earnings = await request(app.getHttpServer())
      .get('/api/v1/driver/earnings')
      .set('Cookie', driverCookies[winner])
      .expect(200);
    expect(earnings.body).toMatchObject({
      balanceAmount: '20000',
      currency: 'IDR',
      entries: [
        expect.objectContaining({
          deliveryId,
          amount: '20000',
        }),
      ],
    });

    const deliveredDetails = await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.id}`)
      .set('Cookie', buyer.cookie)
      .expect(200);
    const reviewedItem = deliveredDetails.body.items[0] as {
      id: string;
      productId: string;
    };
    await request(app.getHttpServer())
      .put(`/api/v1/orders/${order.id}/items/${reviewedItem.id}/review`)
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .send({ rating: 5, comment: 'Too early' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/complete`)
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .expect(201);
    const finance = await request(app.getHttpServer())
      .get('/api/v1/seller/orders/finance')
      .set('Cookie', sellerCookie)
      .expect(200);
    const orderAmount = await database.query<{ total_amount: string }>(
      'SELECT total_amount::text FROM orders WHERE id = $1',
      [order.id],
    );
    expect(finance.body).toMatchObject({
      validAmount: orderAmount.rows[0].total_amount,
      completedAmount: orderAmount.rows[0].total_amount,
      validCount: '1',
      completedCount: '1',
    });
    await request(app.getHttpServer())
      .get('/api/v1/seller/orders/finance')
      .set('Cookie', buyer.cookie)
      .expect(403);
    const details = await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.id}`)
      .set('Cookie', buyer.cookie)
      .expect(200);
    expect(
      details.body.history.map((entry: { to: string }) => entry.to),
    ).toEqual([
      'PACKING',
      'AWAITING_DRIVER',
      'DRIVER_ASSIGNED',
      'IN_TRANSIT',
      'DELIVERED',
      'COMPLETED',
    ]);
    expect(details.body.address.city).toBe('Bandung');
    expect(
      details.body.deliveryHistory.map((entry: { to: string }) => entry.to),
    ).toEqual(['WAITING_FOR_DRIVER', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED']);

    const createdReview = await request(app.getHttpServer())
      .put(`/api/v1/orders/${order.id}/items/${reviewedItem.id}/review`)
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .send({ rating: 5, comment: 'Produk sesuai pesanan.' })
      .expect(200);
    const updatedReview = await request(app.getHttpServer())
      .put(`/api/v1/orders/${order.id}/items/${reviewedItem.id}/review`)
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .send({ rating: 4, comment: 'Produk baik setelah dipakai.' })
      .expect(200);
    expect(updatedReview.body.id).toBe(createdReview.body.id);

    const publicReviews = await request(app.getHttpServer())
      .get(`/api/v1/products/${reviewedItem.productId}/reviews`)
      .expect(200);
    expect(
      publicReviews.body.items.find(
        (review: { orderItemId: string }) =>
          review.orderItemId === reviewedItem.id,
      ),
    ).toMatchObject({ rating: 4, verifiedPurchase: true });

    const ratedProduct = await request(app.getHttpServer())
      .get(`/api/v1/products/${reviewedItem.productId}`)
      .expect(200);
    expect(ratedProduct.body).toMatchObject({
      ratingAverage: 4,
      ratingCount: 1,
    });
    const earningCount = await database.query<{ count: string }>(
      'SELECT count(*) FROM driver_earnings WHERE delivery_id = $1',
      [deliveryId],
    );
    expect(earningCount.rows[0].count).toBe('1');
  });

  it('limits admin monitoring and voucher creation to admins', async () => {
    const adminCookie = await login(`admin-${suffix}@burhanpedia.test`);
    await request(app.getHttpServer())
      .get('/api/v1/admin/operations')
      .set('Cookie', buyer.cookie)
      .expect(403);
    const before = await request(app.getHttpServer())
      .get('/api/v1/admin/operations')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(before.body).toMatchObject({
      orders: expect.any(Array),
      vouchers: expect.any(Array),
      deadLetterCount: expect.any(Number),
    });

    const code = `GATE8_${suffix.toUpperCase()}`;
    const startsAt = new Date(Date.now() - 60_000).toISOString();
    const endsAt = new Date(Date.now() + 86_400_000).toISOString();
    const payload = {
      code,
      name: 'Gate 8 voucher',
      kind: 'FIXED',
      valueAmount: '1000',
      minimumSubtotalAmount: '10000',
      quota: 10,
      perBuyerLimit: 1,
      startsAt,
      endsAt,
    };
    await request(app.getHttpServer())
      .post('/api/v1/admin/vouchers')
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .send(payload)
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/v1/admin/vouchers')
      .set('origin', origin)
      .set('Cookie', adminCookie)
      .send({ ...payload, endsAt: startsAt })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/v1/admin/vouchers')
      .set('origin', origin)
      .set('Cookie', adminCookie)
      .send({ ...payload, valueAmount: '0' })
      .expect(400);
    const created = await request(app.getHttpServer())
      .post('/api/v1/admin/vouchers')
      .set('origin', origin)
      .set('Cookie', adminCookie)
      .send(payload)
      .expect(201);
    expect(created.body).toMatchObject({ code, quota: 10 });
    await request(app.getHttpServer())
      .post('/api/v1/admin/vouchers')
      .set('origin', origin)
      .set('Cookie', adminCookie)
      .send(payload)
      .expect(409);
    const after = await request(app.getHttpServer())
      .get('/api/v1/admin/operations')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(after.body.vouchers).toEqual(
      expect.arrayContaining([expect.objectContaining({ code })]),
    );
  });

  it('advances application time and refunds an overdue order exactly once', async () => {
    const beforeStock = await stock();
    const order = await checkout('overdue-flow', 'REGULAR');
    await process(order.id);
    const adminCookie = await login(`admin-${suffix}@burhanpedia.test`);
    const before = await request(app.getHttpServer())
      .get('/api/v1/admin/clock')
      .set('Cookie', adminCookie)
      .expect(200);
    const advanced = await request(app.getHttpServer())
      .post('/api/v1/admin/clock/advance')
      .set('origin', origin)
      .set('Cookie', adminCookie)
      .send({ days: 5 })
      .expect(201);
    expect(
      new Date(advanced.body.now as string).getTime() -
        new Date(before.body.now as string).getTime(),
    ).toBeGreaterThan(5 * 86_400_000 - 5_000);

    await worker.runOnce();
    await worker.runOnce();
    const state = await database.query<{ status: string }>(
      'SELECT status FROM orders WHERE id = $1',
      [order.id],
    );
    expect(state.rows[0].status).toBe('REFUNDED');
    const refunds = await database.query<{ count: string }>(
      'SELECT count(*) FROM refunds WHERE order_id = $1',
      [order.id],
    );
    const ledger = await database.query<{ count: string }>(
      `SELECT count(*) FROM wallet_ledger_entries
       WHERE idempotency_key = $1`,
      [`refund:order:${order.id}`],
    );
    expect(refunds.rows[0].count).toBe('1');
    expect(ledger.rows[0].count).toBe('1');
    expect(await stock()).toBe(beforeStock);
    const history = await database.query<{ to_status: string }>(
      `SELECT to_status FROM order_status_history
       WHERE order_id = $1 ORDER BY event_sequence`,
      [order.id],
    );
    expect(history.rows.map(({ to_status }) => to_status)).toEqual([
      'PACKING',
      'AWAITING_DRIVER',
      'RETURNED',
      'REFUNDED',
    ]);
  });

  it('recovers exhausted worker locks into the dead-letter queue', async () => {
    const outbox = await database.query<{ id: string }>(
      `INSERT INTO outbox_events
       (aggregate_type, aggregate_id, event_type, payload, status, attempts, locked_at)
       VALUES ('TEST',gen_random_uuid(),'TEST_EVENT','{}','PROCESSING',8,
               now() - interval '10 minutes') RETURNING id`,
    );
    const job = await database.query<{ id: string }>(
      `INSERT INTO background_jobs
       (job_type, deduplication_key, payload, status, attempts, max_attempts, locked_at)
       VALUES ('TEST_DEAD',$1,'{}','RUNNING',3,3,now() - interval '10 minutes')
       RETURNING id`,
      [`dead-letter-${suffix}`],
    );

    await worker.runOnce();
    const dead = await database.query<{ source_kind: string }>(
      `SELECT source_kind FROM dead_letter_events
       WHERE source_id = ANY($1::uuid[]) ORDER BY source_kind`,
      [[outbox.rows[0].id, job.rows[0].id]],
    );
    expect(dead.rows.map(({ source_kind }) => source_kind)).toEqual([
      'JOB',
      'OUTBOX',
    ]);
  });

  it('publishes outbox events durably and without duplicate feed entries', async () => {
    const event = await database.query<{ id: string }>(
      `INSERT INTO outbox_events
       (aggregate_type, aggregate_id, event_type, payload)
       VALUES ('TEST',gen_random_uuid(),'TEST_PUBLICATION',$1::jsonb)
       RETURNING id`,
      [JSON.stringify({ source: suffix })],
    );
    await worker.runOnce();
    await database.query(
      `UPDATE outbox_events SET status = 'PENDING', attempts = 0,
              available_at = application_now() WHERE id = $1`,
      [event.rows[0].id],
    );
    await worker.runOnce();
    const publication = await database.query<{ count: string }>(
      'SELECT count(*) FROM published_events WHERE outbox_event_id = $1',
      [event.rows[0].id],
    );
    expect(publication.rows[0].count).toBe('1');
  });

  it('uses the real clock when the production session mode is set', async () => {
    const client = await database.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.clock_mode', 'real', true)");
      const result = await client.query<{ offset_ms: string }>(
        `SELECT abs(extract(epoch FROM application_now() - now()) * 1000)::text
                AS offset_ms`,
      );
      expect(Number(result.rows[0].offset_ms)).toBeLessThan(1000);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  async function createCatalog() {
    const cookie = await createUser('seller', AppRole.SELLER);
    const store = await request(app.getHttpServer())
      .post('/api/v1/stores')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({ slug: `operations-${suffix}`, name: `Operations ${suffix}` })
      .expect(201);
    const product = await request(app.getHttpServer())
      .post('/api/v1/seller/products')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({
        slug: `operations-product-${suffix}`,
        name: 'Operations Product',
        variants: [
          {
            sku: `OPS-${suffix}`,
            name: 'Default',
            priceAmount: '100000',
            attributes: {},
            onHand: 20,
          },
        ],
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/seller/products/${product.body.id as string}`)
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({ version: product.body.version, status: 'ACTIVE' })
      .expect(200);
    const variant = await database.query<{ id: string }>(
      'SELECT id FROM product_variants WHERE product_id = $1',
      [product.body.id],
    );
    return {
      sellerCookie: cookie,
      storeId: store.body.id as string,
      variantId: variant.rows[0].id,
    };
  }

  async function createBuyer() {
    const cookie = await createUser('buyer', AppRole.BUYER);
    const address = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({
        label: 'Home',
        recipientName: 'Operations Buyer',
        phone: '081234567890',
        line1: 'Jalan Burhan No. 6',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40123',
        isDefault: true,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/api/v1/wallet/top-ups')
      .set('origin', origin)
      .set('Cookie', cookie)
      .set('Idempotency-Key', `operations-topup-${suffix}`)
      .send({ amount: 1_000_000 })
      .expect(201);
    return { cookie, addressId: address.body.id as string };
  }

  async function checkout(label: string, method: string) {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .send({ variantId, quantity: 1 })
      .expect(201);
    const response = await request(app.getHttpServer())
      .post('/api/v1/checkouts')
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .set('Idempotency-Key', `${label}-${suffix}`)
      .send({
        addressId: buyer.addressId,
        deliveries: [{ storeId, method }],
      })
      .expect(201);
    return response.body.orders[0] as { id: string };
  }

  async function process(orderId: string) {
    await request(app.getHttpServer())
      .post(`/api/v1/seller/orders/${orderId}/process`)
      .set('origin', origin)
      .set('Cookie', sellerCookie)
      .expect(201);
  }

  async function stock(): Promise<number> {
    const result = await database.query<{ on_hand: number }>(
      'SELECT on_hand FROM inventories WHERE variant_id = $1',
      [variantId],
    );
    return result.rows[0].on_hand;
  }

  async function createUser(label: string, role: AppRole): Promise<string> {
    const email = `${label}-${suffix}@burhanpedia.test`;
    await identity.register(
      { email, name: `${label} user`, password, roles: [role] },
      { requestId: randomUUID() },
    );
    return login(email);
  }

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password })
      .expect(200);
    return String(response.headers['set-cookie']).split(';')[0];
  }
});
