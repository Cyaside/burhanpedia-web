import { z } from 'zod';

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

const environment = publicEnvironmentSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

export const config = {
  apiUrl: environment.NEXT_PUBLIC_API_URL.replace(/\/$/, ''),
  environment: process.env.NODE_ENV ?? 'development',
} as const;

export const getApiUrl = (endpoint: string) => {
  return `${config.apiUrl}${endpoint}`;
};
