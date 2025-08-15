import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Log utk environment
  console.log(`🚀 Starting Burhanpedia Backend in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Server will listen on port ${process.env.PORT || 3000}`);
  
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:3001',
    'https://burhanpedia-web.vercel.app', // Deployed FE
  ];

  // Add any additional origins from environment variable
  if (process.env.ADDITIONAL_ORIGINS) {
    allowedOrigins.push(...process.env.ADDITIONAL_ORIGINS.split(','));
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
