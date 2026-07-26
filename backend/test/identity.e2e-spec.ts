import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';

function cookies(response: request.Response): Record<string, string> {
  const values = response.headers['set-cookie'] as unknown as
    | string[]
    | undefined;
  return Object.fromEntries(
    (values ?? []).map((value) => {
      const pair = value.split(';', 1)[0];
      const index = pair.indexOf('=');
      return [pair.slice(0, index), pair];
    }),
  );
}

describe('identity session lifecycle', () => {
  let app: INestApplication;
  const origin = 'http://localhost:3001';
  const email = `identity-${Date.now()}@burhanpedia.test`;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
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

  it('rejects public ADMIN registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({
        name: 'Forbidden Admin',
        email: `admin-${email}`,
        password: 'VerySecurePassword123!',
        roles: ['ADMIN'],
      })
      .expect(400);
  });

  it('registers, authenticates, rotates, and detects refresh reuse', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('origin', origin)
      .send({
        name: 'Identity Tester',
        email,
        password: 'VerySecurePassword123!',
        roles: ['BUYER', 'SELLER'],
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('origin', origin)
      .send({ email, password: 'VerySecurePassword123!' })
      .expect(200);
    const loginCookies = cookies(login);
    expect(loginCookies.bp_access).toBeDefined();
    expect(loginCookies.bp_refresh).toBeDefined();
    expect(login.headers['set-cookie']?.join(';')).toContain('HttpOnly');

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Cookie', loginCookies.bp_access)
      .expect(200)
      .expect(({ body }) => expect(body.activeRole).toBe('BUYER'));

    await request(app.getHttpServer())
      .post('/api/v1/me/roles/active')
      .set('origin', origin)
      .set('Cookie', loginCookies.bp_access)
      .send({ role: 'SELLER' })
      .expect(200)
      .expect(({ body }) => expect(body.activeRole).toBe('SELLER'));

    const refresh = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('Cookie', loginCookies.bp_refresh)
      .expect(200);
    const rotatedCookies = cookies(refresh);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('origin', origin)
      .set('Cookie', loginCookies.bp_refresh)
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Cookie', rotatedCookies.bp_access)
      .expect(401);
  });
});
