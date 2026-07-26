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
});
