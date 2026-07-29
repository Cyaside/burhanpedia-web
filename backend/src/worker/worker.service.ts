import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { WorkerProcessor } from './worker.processor';

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private readonly logger = new Logger(WorkerService.name);
  private stopping = false;

  constructor(private readonly processor: WorkerProcessor) {}

  async run(): Promise<void> {
    this.logger.log('Burhanpedia worker is ready');
    while (!this.stopping) {
      const result = await this.processor.runOnce();
      if (result.jobs === 0 && result.outbox === 0) await this.pause(1000);
    }
  }

  onApplicationShutdown(): void {
    this.stopping = true;
  }

  private pause(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
