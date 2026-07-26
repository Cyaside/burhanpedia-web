import { randomUUID } from 'node:crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { RequestContext } from './request-context';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestContext, response: Response, next: NextFunction): void {
    const supplied = request.header('x-request-id');
    request.requestId =
      supplied && UUID_PATTERN.test(supplied) ? supplied : randomUUID();
    response.setHeader('x-request-id', request.requestId);
    next();
  }
}
