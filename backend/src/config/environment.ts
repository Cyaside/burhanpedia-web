const DEFAULTS = {
  PORT: '3000',
  DATABASE_POOL_MAX: '10',
  DATABASE_CONNECTION_TIMEOUT_MS: '5000',
  DATABASE_IDLE_TIMEOUT_MS: '30000',
  DATABASE_STATEMENT_TIMEOUT_MS: '10000',
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
  return config;
}
