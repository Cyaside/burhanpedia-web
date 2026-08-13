import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().refine(
    (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
    'NEXT_PUBLIC_API_URL must be a URL or same-origin path',
  ),
});

const environment = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '/api/v1',
});

const config = {
  apiUrl: environment.NEXT_PUBLIC_API_URL.replace(/\/$/, ''),
  environment: process.env.NODE_ENV ?? 'development',
} as const;

export const getApiUrl = (endpoint: string) => {
  return `${config.apiUrl}${endpoint}`;
};
