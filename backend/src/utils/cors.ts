interface CorsOptions {
  origin: string[] | boolean;
  credentials: boolean;
}

export function buildCorsOrigins(): string[] {
  const defaults = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://burhanpedia-web.vercel.app',
  ];

  const configured = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
  ];

  const additional = (process.env.ADDITIONAL_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const origins = [...defaults, ...configured, ...additional].filter(
    (origin): origin is string =>
      typeof origin === 'string' && origin.trim().length > 0,
  );
  return Array.from(new Set(origins));
}

export function buildCorsOptions(): CorsOptions {
  const origins = buildCorsOrigins();
  return {
    origin: origins.length ? origins : true,
    credentials: true,
  };
}
