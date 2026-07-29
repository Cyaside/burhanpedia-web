import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '../config/environment';
import { DatabaseModule } from '../database/database.module';
import { WorkerService } from './worker.service';
import { WorkerProcessor } from './worker.processor';
import { OperationsModule } from '../modules/operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    OperationsModule,
  ],
  providers: [WorkerProcessor, WorkerService],
  exports: [WorkerProcessor],
})
export class WorkerModule {}
