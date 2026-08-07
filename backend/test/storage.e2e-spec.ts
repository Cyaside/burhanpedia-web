import { createHash } from 'node:crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import sharp from 'sharp';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { STORAGE_PORT } from '../src/modules/storage/storage.port';

describe('seller store logo uploads', () => {
  let app: INestApplication;
  let image: Buffer;
  const origin = 'http://localhost:3001';
  const suffix = Date.now().toString(36);
  const password = 'VerySecurePassword123!';

  beforeAll(async () => {
    image = await sharp({
      create: {
        width: 256,
        height: 256,
        channels: 3,
        background: '#111827',
      },
    })
      .png()
      .toBuffer();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(STORAGE_PORT)
      .useValue({
        signUpload: (key: string, contentType: string) =>
          Promise.resolve({
            url: `https://upload.burhanpedia.test/${key}`,
            headers: { 'Content-Type': contentType },
          }),
        load: () => Promise.resolve(image),
        publicUrl: (key: string) => `https://media.burhanpedia.test/${key}`,
      })
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
  }, 30_000);

  afterAll(async () => app.close());

  it('lets only the owning seller complete and reuse a logo upload', async () => {
    const left = await seller('left');
    const right = await seller('right');
    const requested = await request(app.getHttpServer())
      .post('/api/v1/seller/store/logo/uploads')
      .set('origin', origin)
      .set('Cookie', left.cookie)
      .send({
        contentType: 'image/png',
        byteSize: image.length,
        checksumSha256: createHash('sha256').update(image).digest('hex'),
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(
        `/api/v1/seller/store/logo/uploads/${requested.body.uploadId as string}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', right.cookie)
      .send({ altText: 'Logo wrong owner' })
      .expect(404);

    const completed = await request(app.getHttpServer())
      .post(
        `/api/v1/seller/store/logo/uploads/${requested.body.uploadId as string}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', left.cookie)
      .send({ altText: 'Logo Left Store' })
      .expect(201);
    expect(completed.body.logoUrl).toContain(`/stores/${left.storeId}/logo/`);

    const retry = await request(app.getHttpServer())
      .post(
        `/api/v1/seller/store/logo/uploads/${requested.body.uploadId as string}/complete`,
      )
      .set('origin', origin)
      .set('Cookie', left.cookie)
      .send({ altText: 'Logo Left Store' })
      .expect(201);
    expect(retry.body.logoUrl).toBe(completed.body.logoUrl);

    const publicStore = await request(app.getHttpServer())
      .get(`/api/v1/stores/${left.slug}`)
      .expect(200);
    expect(publicStore.body).toMatchObject({
      logoUrl: completed.body.logoUrl,
      logoAltText: 'Logo Left Store',
    });
  });

  async function seller(label: string) {
    const email = `logo-${label}-${suffix}@burhanpedia.test`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({
        email,
        name: `Logo ${label}`,
        password,
        roles: ['SELLER'],
      })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password })
      .expect(200);
    const cookie = String(login.headers['set-cookie']).split(';')[0];
    const slug = `logo-${label}-${suffix}`;
    const store = await request(app.getHttpServer())
      .post('/api/v1/stores')
      .set('origin', origin)
      .set('Cookie', cookie)
      .send({ slug, name: `Logo ${label} ${suffix}` })
      .expect(201);
    return { cookie, slug, storeId: store.body.id as string };
  }
});
