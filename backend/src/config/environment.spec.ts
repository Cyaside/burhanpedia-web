import { validateEnvironment } from './environment';

const validEnvironment = {
  DATABASE_URL: 'postgresql://user:password@localhost:5432/burhanpedia_test',
  JWT_ACCESS_SECRET: 'a-secure-test-secret-with-at-least-32-characters',
};

describe('validateEnvironment', () => {
  it('rejects startup without an access-token secret', () => {
    expect(() =>
      validateEnvironment({ DATABASE_URL: validEnvironment.DATABASE_URL }),
    ).toThrow('JWT_ACCESS_SECRET');
  });

  it('rejects a short access-token secret', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, JWT_ACCESS_SECRET: 'short' }),
    ).toThrow('at least 32 characters');
  });

  it('applies secure numeric defaults', () => {
    const result = validateEnvironment(validEnvironment);
    expect(result.JWT_ACCESS_TTL_SECONDS).toBe('900');
    expect(result.REFRESH_TOKEN_TTL_DAYS).toBe('30');
    expect(result.COOKIE_SECURE).toBe('false');
    expect(result.LOG_SLOW_REQUEST_MS).toBe('750');
  });

  it('rejects an invalid slow-request threshold', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        LOG_SLOW_REQUEST_MS: '0',
      }),
    ).toThrow('LOG_SLOW_REQUEST_MS must be a positive integer');
  });

  it('requires secure cookies in production', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://burhanpedia.example',
        COOKIE_SECURE: 'false',
      }),
    ).toThrow('COOKIE_SECURE must be true');
  });

  it.each([
    {
      DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
    },
    {
      DATABASE_URL:
        'postgresql://user:password@db.example.test:5432/burhanpedia?sslmode=no-verify',
    },
  ])(
    'requires PostgreSQL certificate verification in production',
    (override) => {
      expect(() =>
        validateEnvironment({
          ...validEnvironment,
          NODE_ENV: 'production',
          FRONTEND_URL: 'https://burhanpedia.example',
          COOKIE_SECURE: 'true',
          ...override,
        }),
      ).toThrow('PostgreSQL certificate verification is required');
    },
  );
});
