import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../../../common/security/current-user.decorator';
import { Public } from '../../../common/security/public.decorator';
import type { AuthenticatedRequest } from '../../../common/security/authenticated-request';
import type { RequestContext } from '../../../common/http/request-context';
import {
  LoginDto,
  RegisterDto,
  SwitchRoleDto,
} from '../application/identity.dto';
import { IdentityService } from '../application/identity.service';
import type { AuthTokens, SessionPrincipal } from '../domain/identity.types';

const ACCESS_COOKIE = 'bp_access';
const REFRESH_COOKIE = 'bp_refresh';

@Controller('auth')
export class AuthController {
  private readonly secureCookies: boolean;
  private readonly accessTtlMs: number;

  constructor(
    private readonly identity: IdentityService,
    config: ConfigService,
  ) {
    this.secureCookies = config.getOrThrow<string>('COOKIE_SECURE') === 'true';
    this.accessTtlMs =
      Number(config.getOrThrow<string>('JWT_ACCESS_TTL_SECONDS')) * 1000;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() request: RequestContext) {
    return this.identity.register(dto, this.metadata(request));
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() request: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.identity.login(dto, this.metadata(request));
    this.setSessionCookies(response, result.tokens);
    return { user: this.present(result.principal) };
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException({
        code: 'REFRESH_COOKIE_REQUIRED',
        detail: 'A refresh cookie is required.',
      });
    }
    const result = await this.identity.refresh(token, this.metadata(request));
    this.setSessionCookies(response, result.tokens);
    return { user: this.present(result.principal) };
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(
    @CurrentUser() principal: SessionPrincipal,
    @Req() request: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.identity.logout(principal, this.metadata(request));
    response.clearCookie(ACCESS_COOKIE, this.accessCookieOptions());
    response.clearCookie(REFRESH_COOKIE, this.refreshCookieOptions());
  }

  private metadata(request: RequestContext) {
    return this.identity.metadata({
      requestId: request.requestId,
      ip: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  private setSessionCookies(response: Response, tokens: AuthTokens): void {
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...this.accessCookieOptions(),
      maxAge: this.accessTtlMs,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...this.refreshCookieOptions(),
      expires: tokens.refreshExpiresAt,
    });
  }

  private accessCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'lax',
      path: '/api/v1',
    };
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secureCookies,
      sameSite: 'strict',
      path: '/api/v1/auth/refresh',
    };
  }

  private present(principal: SessionPrincipal) {
    return {
      id: principal.userId,
      name: principal.name,
      email: principal.email,
      roles: principal.roles,
      activeRole: principal.activeRole,
    };
  }
}

@Controller('me')
export class MeController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  me(@CurrentUser() principal: SessionPrincipal) {
    return this.present(principal);
  }

  @HttpCode(HttpStatus.OK)
  @Post('roles/active')
  async switchRole(
    @Body() dto: SwitchRoleDto,
    @CurrentUser() principal: SessionPrincipal,
    @Req() request: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.identity.switchRole(
      principal,
      dto.role,
      this.identity.metadata({
        requestId: request.requestId,
        ip: request.ip,
        userAgent: request.header('user-agent'),
      }),
    );
    response.cookie('bp_access', result.accessToken, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/api/v1',
      maxAge: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? '900') * 1000,
    });
    return this.present(result.principal);
  }

  private present(principal: SessionPrincipal) {
    return {
      id: principal.userId,
      name: principal.name,
      email: principal.email,
      roles: principal.roles,
      activeRole: principal.activeRole,
    };
  }
}
