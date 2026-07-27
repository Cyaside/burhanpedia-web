const DEFAULTS = {
  PORT: '3000',
  DATABASE_POOL_MAX: '10',
  DATABASE_CONNECTION_TIMEOUT_MS: '5000',
  DATABASE_IDLE_TIMEOUT_MS: '30000',
  DATABASE_STATEMENT_TIMEOUT_MS: '10000',
  JWT_ACCESS_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_DAYS: '30',
  FRONTEND_URL: 'http://localhost:3001',
} as const;

function requireNonEmpty(config: Record<string, unknown>, key: string): string {
  const value = config[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function positiveInteger(
  value: unknown,
  key: string,
  fallback: string,
): string {
  const normalized =
    typeof value === 'string' && value !== '' ? value : fallback;
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return String(parsed);
}

export function validateEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const config = { ...input };
  config.DATABASE_URL = requireNonEmpty(config, 'DATABASE_URL');
  config.PORT = positiveInteger(config.PORT, 'PORT', DEFAULTS.PORT);
  config.DATABASE_POOL_MAX = positiveInteger(
    config.DATABASE_POOL_MAX,
    'DATABASE_POOL_MAX',
    DEFAULTS.DATABASE_POOL_MAX,
  );
  config.DATABASE_CONNECTION_TIMEOUT_MS = positiveInteger(
    config.DATABASE_CONNECTION_TIMEOUT_MS,
    'DATABASE_CONNECTION_TIMEOUT_MS',
    DEFAULTS.DATABASE_CONNECTION_TIMEOUT_MS,
  );
  config.DATABASE_IDLE_TIMEOUT_MS = positiveInteger(
    config.DATABASE_IDLE_TIMEOUT_MS,
    'DATABASE_IDLE_TIMEOUT_MS',
    DEFAULTS.DATABASE_IDLE_TIMEOUT_MS,
  );
  config.DATABASE_STATEMENT_TIMEOUT_MS = positiveInteger(
    config.DATABASE_STATEMENT_TIMEOUT_MS,
    'DATABASE_STATEMENT_TIMEOUT_MS',
    DEFAULTS.DATABASE_STATEMENT_TIMEOUT_MS,
  );
  const jwtSecret = requireNonEmpty(config, 'JWT_ACCESS_SECRET');
  if (jwtSecret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
  }
  config.JWT_ACCESS_SECRET = jwtSecret;
  config.JWT_ACCESS_TTL_SECONDS = positiveInteger(
    config.JWT_ACCESS_TTL_SECONDS,
    'JWT_ACCESS_TTL_SECONDS',
    DEFAULTS.JWT_ACCESS_TTL_SECONDS,
  );
  config.REFRESH_TOKEN_TTL_DAYS = positiveInteger(
    config.REFRESH_TOKEN_TTL_DAYS,
    'REFRESH_TOKEN_TTL_DAYS',
    DEFAULTS.REFRESH_TOKEN_TTL_DAYS,
  );
  config.FRONTEND_URL =
    typeof config.FRONTEND_URL === 'string' && config.FRONTEND_URL !== ''
      ? config.FRONTEND_URL
      : DEFAULTS.FRONTEND_URL;
  const cookieSecure = config.COOKIE_SECURE ?? 'false';
  if (cookieSecure !== 'true' && cookieSecure !== 'false') {
    throw new Error('COOKIE_SECURE must be true or false');
  }
  config.COOKIE_SECURE = cookieSecure;
  if (config.NODE_ENV === 'production' && cookieSecure !== 'true') {
    throw new Error('COOKIE_SECURE must be true in production');
  }
  if (
    config.NODE_ENV === 'production' &&
    config.FRONTEND_URL === DEFAULTS.FRONTEND_URL
  ) {
    throw new Error('FRONTEND_URL must be configured in production');
  }
  const storageKeys = [
    'S3_REGION',
    'S3_BUCKET',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_PUBLIC_BASE_URL',
  ];
  const configuredStorageKeys = storageKeys.filter(
    (key) => typeof config[key] === 'string' && config[key] !== '',
  );
  if (
    (configuredStorageKeys.length > 0 &&
      configuredStorageKeys.length !== storageKeys.length) ||
    (config.NODE_ENV === 'production' && configuredStorageKeys.length === 0)
  ) {
    throw new Error('All S3 storage environment variables must be configured');
  }
  return config;
}
