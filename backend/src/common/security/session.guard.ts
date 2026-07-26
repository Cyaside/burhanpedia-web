import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IdentityRepository } from '../../modules/identity/infrastructure/identity.repository';
import { AuthenticatedRequest } from './authenticated-request';
import { IS_PUBLIC_KEY } from './public.decorator';

interface AccessPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly identities: IdentityRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = request.header('authorization');
    const token = bearer?.startsWith('Bearer ')
      ? bearer.slice(7)
      : request.cookies?.bp_access;
    if (!token) throw this.unauthorized();

    try {
      const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
        issuer: 'burhanpedia-api',
        audience: 'burhanpedia-web',
      });
      const principal = await this.identities.findPrincipal(payload.sid);
      if (!principal || principal.userId !== payload.sub) {
        throw this.unauthorized();
      }
      request.auth = principal;
      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
      detail: 'A valid session is required.',
    });
  }
}
