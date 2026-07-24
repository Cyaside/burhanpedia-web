import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  async run(): Promise<never> {
    this.logger.log('Burhanpedia worker is ready');
    return new Promise<never>(() => undefined);
  }
}
