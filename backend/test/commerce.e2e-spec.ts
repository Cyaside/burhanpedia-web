import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { IdentityService } from '../src/modules/identity/application/identity.service';
import { AppRole } from '../src/modules/identity/domain/identity.types';

interface BuyerFixture {
  cookie: string;
  addressId: string;
}

describe('cart wallet and transactional checkout', () => {
  let app: INestApplication;
  let database: DatabaseService;
  let identity: IdentityService;
  const origin = 'http://localhost:3001';
  const suffix = Date.now().toString(36);
  const password = 'VerySecurePassword123!';
  const stores: Array<{ id: string; variantId: string }> = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
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
    stores.push(await createSellerProduct('alpha', 300_000, 10));
    stores.push(await createSellerProduct('beta', 200_000, 10));
  });

  afterAll(async () => app.close());

  it('keeps a server-side multi-store cart and immutable wallet ledger', async () => {
    const buyer = await createBuyer('primary');
    for (const store of stores) {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('origin', origin)
        .set('Cookie', buyer.cookie)
        .send({ variantId: store.variantId, quantity: 1 })
        .expect(201);
    }
    const cart = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Cookie', buyer.cookie)
      .expect(200);
    expect(cart.body.groups).toHaveLength(2);
    expect(cart.body.subtotalAmount).toBe('500000');

    await request(app.getHttpServer())
      .post('/api/v1/wallet/top-ups')
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .set('Idempotency-Key', `topup-${suffix}-primary`)
      .send({ amount: 1_000_000 })
      .expect(201);
    const retry = await request(app.getHttpServer())
      .post('/api/v1/wallet/top-ups')
      .set('origin', origin)
      .set('Cookie', buyer.cookie)
      .set('Idempotency-Key', `topup-${suffix}-primary`)
      .send({ amount: 1_000_000 })
      .expect(201);
    expect(retry.body.balanceAfter).toBe('1000000');

    const ledgerCount = await database.query<{ count: string }>(
      `SELECT count(*) FROM wallet_ledger_entries e
       JOIN wallet_accounts w ON w.id = e.wallet_account_id
       JOIN buyer_profiles bp ON bp.id = w.buyer_profile_id
       JOIN users u ON u.id = bp.user_id
       WHERE u.email = $1 AND e.entry_type = 'TOP_UP'`,
      [`primary-${suffix}@burhanpedia.test`],
    );
    expect(ledgerCount.rows[0].count).toBe('1');
  });

  it('quotes and atomically creates split orders without trusting client totals', async () => {
    const login = await loginBuyer('primary');
    const address = await addressesFor(login.cookie);
    const payload = {
      addressId: address,
      deliveries: [
        { storeId: stores[0].id, method: 'REGULAR' },
        { storeId: stores[1].id, method: 'NEXT_DAY' },
      ],
    };
    const quote = await request(app.getHttpServer())
      .post('/api/v1/checkout/quote')
      .set('origin', origin)
      .set('Cookie', login.cookie)
      .send(payload)
      .expect(201);
    expect(quote.body).toMatchObject({
      subtotalAmount: '500000',
      shippingAmount: '25000',
      totalAmount: '525000',
    });

    await request(app.getHttpServer())
      .post('/api/v1/checkouts')
      .set('origin', origin)
      .set('Cookie', login.cookie)
      .set('Idempotency-Key', `checkout-${suffix}-split-bad`)
      .send({ ...payload, totalAmount: '1' })
      .expect(400);

    const first = await request(app.getHttpServer())
      .post('/api/v1/checkouts')
      .set('origin', origin)
      .set('Cookie', login.cookie)
      .set('Idempotency-Key', `checkout-${suffix}-split`)
      .send(payload)
      .expect(201);
    expect(first.body.orders).toHaveLength(2);
    expect(first.body.totalAmount).toBe('525000');

    const retry = await request(app.getHttpServer())
      .post('/api/v1/checkouts')
      .set('origin', origin)
      .set('Cookie', login.cookie)
      .set('Idempotency-Key', `checkout-${suffix}-split`)
      .send(payload)
      .expect(201);
    expect(retry.body.id).toBe(first.body.id);

    const paymentCount = await database.query<{ count: string }>(
      'SELECT count(*) FROM payments WHERE checkout_group_id = $1',
      [first.body.id],
    );
    expect(paymentCount.rows[0].count).toBe('1');
  });

  it('allows only one concurrent checkout to buy the final stock', async () => {
    const limited = stores[0];
    await database.query(
      'UPDATE inventories SET on_hand = 1, reserved = 0 WHERE variant_id = $1',
      [limited.variantId],
    );
    const left = await createBuyer('race-left');
    const right = await createBuyer('race-right');
    for (const buyer of [left, right]) {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('origin', origin)
        .set('Cookie', buyer.cookie)
        .send({ variantId: limited.variantId, quantity: 1 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/wallet/top-ups')
        .set('origin', origin)
        .set('Cookie', buyer.cookie)
        .set('Idempotency-Key', `topup-${suffix}-${buyer.addressId}`)
        .send({ amount: 500_000 })
        .expect(201);
    }
    const results = await Promise.all(
      [left, right].map((buyer, index) =>
        request(app.getHttpServer())
          .post('/api/v1/checkouts')
          .set('origin', origin)
          .set('Cookie', buyer.cookie)
          .set('Idempotency-Key', `checkout-${suffix}-race-${index}`)
          .send({
            addressId: buyer.addressId,
            deliveries: [{ storeId: limited.id, method: 'INSTANT' }],
          }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 422]);
    const inventory = await database.query<{ on_hand: number }>(
      'SELECT on_hand FROM inventories WHERE variant_id = $1',
      [limited.variantId],
    );
    expect(inventory.rows[0].on_hand).toBe(0);
  });

  it('serializes the final voucher redemption under concurrent checkout', async () => {
    const promotion = await database.query<{ id: string }>(
      `INSERT INTO promotions
       (code, name, kind, value_amount, minimum_subtotal_amount,
        starts_at, ends_at, is_active)
       VALUES ($1,$2,'FIXED',50000,100000,application_now() - interval '1 hour',
               application_now() + interval '1 day',true) RETURNING id`,
      [`PROMO-${suffix}`.toUpperCase(), `Concurrent promo ${suffix}`],
    );
    const voucher = await database.query<{ code: string }>(
      `INSERT INTO vouchers
       (promotion_id, code, quota, per_buyer_limit, starts_at, ends_at)
       VALUES ($1,$2,1,1,application_now() - interval '1 hour',
               application_now() + interval '1 day') RETURNING code`,
      [promotion.rows[0].id, `LAST-${suffix}`.toUpperCase()],
    );
    await database.query(
      'UPDATE inventories SET on_hand = 10, reserved = 0 WHERE variant_id = $1',
      [stores[1].variantId],
    );
    const buyers = [
      await createBuyerDirect('voucher-left'),
      await createBuyerDirect('voucher-right'),
    ];
    for (const buyer of buyers) {
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('origin', origin)
        .set('Cookie', buyer.cookie)
        .send({ variantId: stores[1].variantId, quantity: 1 })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/wallet/top-ups')
        .set('origin', origin)
        .set('Cookie', buyer.cookie)
        .set('Idempotency-Key', `topup-${suffix}-${buyer.addressId}`)
        .send({ amount: 500_000 })
        .expect(201);
    }
    const results = await Promise.all(
      buyers.map((buyer, index) =>
        request(app.getHttpServer())
          .post('/api/v1/checkouts')
          .set('origin', origin)
          .set('Cookie', buyer.cookie)
          .set('Idempotency-Key', `checkout-${suffix}-voucher-${index}`)
          .send({
            addressId: buyer.addressId,
            voucherCode: voucher.rows[0].code,
            deliveries: [{ storeId: stores[1].id, method: 'REGULAR' }],
          }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 422]);
    const redemption = await database.query<{ count: string }>(
      'SELECT count(*) FROM voucher_redemptions WHERE voucher_id = (SELECT id FROM vouchers WHERE code = $1)',
      [voucher.rows[0].code],
    );
    expect(redemption.rows[0].count).toBe('1');
  });

  async function createSellerProduct(
    label: string,
    price: number,
    stock: number,
  ) {
    const email = `seller-${label}-${suffix}@burhanpedia.test`;
    await register(email, `Seller ${label}`, ['SELLER']);
    const cookie = await login(email);
    const store = await request(app.getHttpServer())
      .post('/api/v1/stores')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({ slug: `${label}-${suffix}`, name: `${label} Store ${suffix}` })
      .expect(201);
    const product = await request(app.getHttpServer())
      .post('/api/v1/seller/products')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({
        slug: `${label}-product-${suffix}`,
        name: `${label} Product`,
        variants: [
          {
            sku: `${label.toUpperCase()}-${suffix}`,
            name: 'Default',
            priceAmount: String(price),
            attributes: {},
            onHand: stock,
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
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/products/${product.body.id as string}`)
      .expect(200);
    return {
      id: store.body.id as string,
      variantId: detail.body.variants[0].id as string,
    };
  }

  async function createBuyer(label: string): Promise<BuyerFixture> {
    const email = `${label}-${suffix}@burhanpedia.test`;
    await register(email, `Buyer ${label}`, ['BUYER']);
    const cookie = await login(email);
    const address = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({
        label: 'Home',
        recipientName: `Buyer ${label}`,
        phone: '081234567890',
        line1: 'Jalan Burhan No. 1',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40123',
        isDefault: true,
      })
      .expect(201);
    return { cookie, addressId: address.body.id as string };
  }

  async function createBuyerDirect(label: string): Promise<BuyerFixture> {
    const email = `${label}-${suffix}@burhanpedia.test`;
    await identity.register(
      { email, name: `Buyer ${label}`, password, roles: [AppRole.BUYER] },
      { requestId: randomUUID() },
    );
    const cookie = await login(email);
    const address = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({
        label: 'Home',
        recipientName: `Buyer ${label}`,
        phone: '081234567890',
        line1: 'Jalan Burhan No. 2',
        city: 'Bandung',
        province: 'Jawa Barat',
        postalCode: '40123',
        isDefault: true,
      })
      .expect(201);
    return { cookie, addressId: address.body.id as string };
  }

  async function loginBuyer(label: string) {
    return { cookie: await login(`${label}-${suffix}@burhanpedia.test`) };
  }

  async function addressesFor(cookie: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .get('/api/v1/addresses')
      .set('Cookie', cookie)
      .expect(200);
    return response.body[0].id as string;
  }

  async function register(email: string, name: string, roles: string[]) {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({ email, name, password, roles })
      .expect(201);
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
