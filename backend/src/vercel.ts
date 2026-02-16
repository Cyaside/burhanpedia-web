import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { buildCorsOptions } from './utils/cors';
import type { Request, Response } from 'express';

// Khusus buat vercel
type ExpressHandler = (req: Request, res: Response) => unknown;
let cachedServer: ExpressHandler | null = null;

async function bootstrapServer(): Promise<ExpressHandler> {
  const app = await NestFactory.create(AppModule);

  console.log(
    `🚀 Starting Burhanpedia Backend in ${process.env.NODE_ENV || 'development'} mode`,
  );
  console.log(`📡 Server will listen on port ${process.env.PORT || 3000}`);

  app.enableCors(buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );

  await app.init();
  const instance = app.getHttpAdapter().getInstance() as ExpressHandler;
  return instance;
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<unknown> {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}
