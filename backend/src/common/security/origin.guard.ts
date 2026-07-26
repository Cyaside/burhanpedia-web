import { CanActivate, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { buildCorsOrigins } from '../../utils/cors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins = new Set(buildCorsOrigins());

  canActivate(context: import('@nestjs/common').ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const origin = request.header('origin');
    if (!origin) return true;
    if (!this.allowedOrigins.has(origin)) {
      throw new ForbiddenException({
        code: 'ORIGIN_NOT_ALLOWED',
        detail: 'The request origin is not allowed.',
      });
    }
    return true;
  }
}
