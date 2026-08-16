import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { RequestContext } from './request-context';

interface RequestLog {
  event: 'http_request_completed';
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  slow: boolean;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  private readonly slowRequestMs: number;

  constructor(config: ConfigService) {
    this.slowRequestMs = Number(
      config.get<string>('LOG_SLOW_REQUEST_MS', '750'),
    );
  }

  use(request: RequestContext, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    response.once('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const entry: RequestLog = {
        event: 'http_request_completed',
        requestId: request.requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        slow: durationMs >= this.slowRequestMs,
      };
      const message = JSON.stringify(entry);

      if (response.statusCode >= 500) {
        this.logger.error(message);
      } else if (entry.slow || response.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
