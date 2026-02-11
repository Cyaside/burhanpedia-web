import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { buildCorsOptions } from './utils/cors';

// Khusus buat vercel
let cachedServer: any;

async function bootstrapServer() {
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
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req, res) {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return cachedServer(req, res);
}
