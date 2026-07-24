import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker/worker.module';
import { WorkerService } from './worker/worker.service';

async function bootstrap(): Promise<void> {
  const context = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['error', 'warn', 'log'],
  });
  context.enableShutdownHooks();
  await context.get(WorkerService).run();
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('WorkerBootstrap');
  logger.error('Worker terminated unexpectedly', error);
  process.exitCode = 1;
});
