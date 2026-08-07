import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import { STORAGE_PORT } from '../src/modules/storage/storage.port';
import type { StoragePort } from '../src/modules/storage/storage.port';

describe('catalog and seller ownership', () => {
  let app: INestApplication;
  const origin = 'http://localhost:3001';
  const suffix = Date.now().toString(36);
  const email = `catalog-${suffix}@burhanpedia.test`;
  let accessCookie: string;
  let storeId: string;
  let productId: string;
  let productVersion: number;
  let variantId: string;
  let imageBytes: Buffer;

  beforeAll(async () => {
    imageBytes = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: '#ffffff',
      },
    })
      .png()
      .toBuffer();
    const storage: StoragePort = {
      signUpload: (key, contentType) =>
        Promise.resolve({
          url: `https://storage.example/${key}`,
          headers: { 'Content-Type': contentType },
        }),
      load: () => Promise.resolve(imageBytes),
      publicUrl: (key) => `https://storage.example/${key}`,
    };
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(STORAGE_PORT)
      .useValue(storage)
      .compile();
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
  });

  afterAll(async () => app.close());

  it('creates a seller store and two products with variants', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({
        name: 'Catalog Seller',
        email,
        password: 'VerySecurePassword123!',
        roles: ['SELLER'],
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password: 'VerySecurePassword123!' })
      .expect(200);
    accessCookie = String(login.headers['set-cookie']).split(';')[0];

    const store = await request(app.getHttpServer())
      .post('/api/v1/stores')
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ slug: `test-store-${suffix}`, name: `Test Store ${suffix}` })
      .expect(201);
    storeId = store.body.id as string;
    expect(store.body.logoUrl).toBeNull();
    expect(store.body.logoAltText).toBeNull();

    for (const [index, name] of ['Desk Lamp', 'Reading Lamp'].entries()) {
      const product = await request(app.getHttpServer())
        .post('/api/v1/seller/products')
        .set('origin', origin)
        .set('Cookie', accessCookie)
        .send({
          slug: `lamp-${index}-${suffix}`,
          name,
          description: 'A practical LED lamp for reading.',
          variants: [
            {
              sku: `LAMP-${index}-${suffix}`,
              name: 'Default',
              priceAmount: String(125_000 + index * 25_000),
              attributes: { color: 'black' },
              onHand: 5,
            },
          ],
        })
        .expect(201);
      if (index === 0) {
        productId = product.body.id as string;
        productVersion = product.body.version as number;
      }
      await request(app.getHttpServer())
        .patch(`/api/v1/seller/products/${product.body.id as string}`)
        .set('origin', origin)
        .set('Cookie', accessCookie)
        .send({ version: product.body.version, status: 'ACTIVE' })
        .expect(200);
    }
  });

  it('returns keyset-paginated search and one-query product detail', async () => {
    const querySpy = jest.spyOn(app.get(DatabaseService), 'query');
    const first = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ q: 'Lamp', storeId, sort: 'price_asc', limit: 1 })
      .expect(200);
    expect(first.body.items).toHaveLength(1);
    expect(first.body.items[0].minPriceAmount).toBe('125000');
    expect(first.body.nextCursor).toEqual(expect.any(String));
    expect(querySpy).toHaveBeenCalledTimes(1);
    querySpy.mockClear();

    const second = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({
        q: 'Lamp',
        storeId,
        sort: 'price_asc',
        limit: 1,
        cursor: first.body.nextCursor,
      })
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
    expect(second.body.nextCursor).toBeNull();

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(detail.body.variants).toHaveLength(1);
    expect(detail.body.variants[0].availableQuantity).toBe(5);
    expect(querySpy).toHaveBeenCalledTimes(2);
    variantId = detail.body.variants[0].id as string;
    querySpy.mockRestore();

    await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ sort: 'newest', cursor: first.body.nextCursor })
      .expect(400);
  });

  it('filters by price and minimum rated products', async () => {
    const price = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ storeId, minPrice: '140000', maxPrice: '160000' })
      .expect(200);
    expect(price.body.items).toHaveLength(1);
    expect(price.body.items[0].minPriceAmount).toBe('150000');

    const rated = await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ storeId, minRating: 4 })
      .expect(200);
    expect(rated.body.items).toHaveLength(0);

    await request(app.getHttpServer())
      .get('/api/v1/products')
      .query({ minRating: 6 })
      .expect(400);
  });

  it('paginates seller products without exposing another store', async () => {
    const first = await request(app.getHttpServer())
      .get('/api/v1/seller/products')
      .set('Cookie', accessCookie)
      .query({ limit: 1 })
      .expect(200);
    expect(first.body.items).toHaveLength(1);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await request(app.getHttpServer())
      .get('/api/v1/seller/products')
      .set('Cookie', accessCookie)
      .query({ limit: 1, cursor: first.body.nextCursor })
      .expect(200);
    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
    expect(second.body.nextCursor).toBeNull();

    const ownProduct = await request(app.getHttpServer())
      .get(`/api/v1/seller/products/${productId}`)
      .set('Cookie', accessCookie)
      .expect(200);
    expect(ownProduct.body).toMatchObject({
      id: productId,
      variants: [expect.objectContaining({ id: variantId, onHand: 5 })],
    });

    await request(app.getHttpServer())
      .get('/api/v1/seller/products')
      .set('Cookie', accessCookie)
      .query({ cursor: 'invalid' })
      .expect(400);
  });

  it('enforces ownership, version checks, and nonnegative inventory', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/seller/products/${productId}`)
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ version: productVersion, name: 'Stale update' })
      .expect(409);

    await request(app.getHttpServer())
      .post(`/api/v1/seller/variants/${variantId}/inventory/adjustments`)
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ quantityDelta: -6, reason: 'Count correction' })
      .expect(422);

    const adjustment = await request(app.getHttpServer())
      .post(`/api/v1/seller/variants/${variantId}/inventory/adjustments`)
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ quantityDelta: -2, reason: 'Count correction' })
      .expect(201);
    expect(adjustment.body.onHand).toBe(3);

    const otherEmail = `other-${email}`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({
        name: 'Other Seller',
        email: otherEmail,
        password: 'VerySecurePassword123!',
        roles: ['SELLER'],
      })
      .expect(201);
    const otherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email: otherEmail, password: 'VerySecurePassword123!' })
      .expect(200);
    const otherCookie = String(otherLogin.headers['set-cookie']).split(';')[0];
    await request(app.getHttpServer())
      .get(`/api/v1/seller/products/${productId}`)
      .set('Cookie', otherCookie)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/api/v1/seller/variants/${variantId}/inventory/adjustments`)
      .set('origin', origin)
      .set('Cookie', otherCookie)
      .send({ quantityDelta: 1, reason: 'Unauthorized adjustment' })
      .expect(404);
  });

  it('signs and verifies product images before publication', async () => {
    const checksumSha256 = createHash('sha256')
      .update(imageBytes)
      .digest('hex');
    const requested = await request(app.getHttpServer())
      .post(`/api/v1/seller/products/${productId}/images/uploads`)
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({
        contentType: 'image/png',
        byteSize: imageBytes.length,
        checksumSha256,
      })
      .expect(201);
    expect(requested.body.url).toContain('https://storage.example/');
    const uploadId = requested.body.uploadId as string;

    const completed = await request(app.getHttpServer())
      .post(
        `/api/v1/seller/products/${productId}/images/uploads/${uploadId}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ altText: 'Desk lamp on a table' })
      .expect(201);
    expect(completed.body.altText).toBe('Desk lamp on a table');

    const retry = await request(app.getHttpServer())
      .post(
        `/api/v1/seller/products/${productId}/images/uploads/${uploadId}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ altText: 'Desk lamp on a table' })
      .expect(201);
    expect(retry.body.id).toBe(completed.body.id);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(detail.body.images).toHaveLength(1);

    const invalid = await request(app.getHttpServer())
      .post(`/api/v1/seller/products/${productId}/images/uploads`)
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({
        contentType: 'image/png',
        byteSize: imageBytes.length,
        checksumSha256: '0'.repeat(64),
      })
      .expect(201);
    await request(app.getHttpServer())
      .post(
        `/api/v1/seller/products/${productId}/images/uploads/${invalid.body.uploadId as string}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', accessCookie)
      .send({ altText: 'Invalid image' })
      .expect(422);
  });
});
