import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../../modules/identity/domain/identity.types';
import { AuthenticatedRequest } from './authenticated-request';
import { REQUIRED_ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppRole[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!roles?.length) return true;

    const principal = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().auth;
    if (!principal || !roles.includes(principal.activeRole)) {
      throw new ForbiddenException({
        code: 'ACTIVE_ROLE_FORBIDDEN',
        detail: 'The active role cannot perform this action.',
      });
    }
    return true;
  }
}
