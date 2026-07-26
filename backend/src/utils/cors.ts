interface CorsOptions {
  origin: string[] | boolean;
  credentials: boolean;
}

export function buildCorsOrigins(): string[] {
  const configured = [process.env.FRONTEND_URL];
  const developmentOrigins =
    process.env.NODE_ENV === 'production'
      ? []
      : ['http://localhost:3000', 'http://localhost:3001'];

  const additional = (process.env.ADDITIONAL_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = [...developmentOrigins, ...configured, ...additional].filter(
    (origin): origin is string =>
      typeof origin === 'string' && origin.trim().length > 0,
  );
  return Array.from(new Set(origins));
}

export function buildCorsOptions(): CorsOptions {
  const origins = buildCorsOrigins();
  return {
    origin: origins,
    credentials: true,
  };
}
