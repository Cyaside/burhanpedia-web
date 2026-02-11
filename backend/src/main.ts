import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { buildCorsOptions } from './utils/cors';

// Ganti yang di vercel.json dari vercel.ts ke main.ts(ini) kalau mw ganti
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log utk environment
  console.log(
    `🚀 Starting Burhanpedia Backend in ${process.env.NODE_ENV || 'development'} mode`,
  );
  console.log(`📡 Server will listen on port ${process.env.PORT || 3000}`);

  app.enableCors(buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
