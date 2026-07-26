import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DatabaseError } from 'pg';
import { LoginDto, RegisterDto } from './identity.dto';
import {
  AppRole,
  AuthTokens,
  SessionMetadata,
  SessionPrincipal,
} from '../domain/identity.types';
import { IdentityRepository } from '../infrastructure/identity.repository';

@Injectable()
export class IdentityService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlDays: number;
  private readonly secret: string;

  constructor(
    private readonly identities: IdentityRepository,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessTtlSeconds = Number(
      config.getOrThrow<string>('JWT_ACCESS_TTL_SECONDS'),
    );
    this.refreshTtlDays = Number(
      config.getOrThrow<string>('REFRESH_TOKEN_TTL_DAYS'),
    );
    this.secret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  async register(dto: RegisterDto, metadata: SessionMetadata) {
    const roles = [...new Set(dto.roles)];
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
    try {
      return await this.identities.createUser({
        email: dto.email,
        name: dto.name,
        passwordHash,
        roles,
        metadata,
      });
    } catch (error) {
      if (error instanceof DatabaseError && error.code === '23505') {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_REGISTERED',
          detail: 'An account with this email already exists.',
        });
      }
      throw error;
    }
  }

  async login(
    dto: LoginDto,
    metadata: SessionMetadata,
  ): Promise<{ principal: SessionPrincipal; tokens: AuthTokens }> {
    const user = await this.identities.findCredentials(dto.email);
    if (!user || !(await argon2.verify(user.password_hash, dto.password))) {
      throw this.invalidCredentials();
    }
    const sessionId = randomUUID();
    const refreshToken = this.refreshToken(sessionId);
    const refreshExpiresAt = this.refreshExpiry();
    const principal = await this.identities.createSession({
      sessionId,
      user,
      activeRole: user.roles.includes(AppRole.BUYER)
        ? AppRole.BUYER
        : user.roles[0],
      familyId: randomUUID(),
      refreshTokenHash: this.hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
      metadata,
    });
    return {
      principal,
      tokens: await this.tokens(principal, refreshToken, refreshExpiresAt),
    };
  }

  async refresh(
    refreshToken: string,
    metadata: SessionMetadata,
  ): Promise<{ principal: SessionPrincipal; tokens: AuthTokens }> {
    const [sessionId, secret] = refreshToken.split('.');
    if (!sessionId || !secret) throw this.invalidSession();

    const nextSessionId = randomUUID();
    const nextToken = this.refreshToken(nextSessionId);
    const refreshExpiresAt = this.refreshExpiry();
    const result = await this.identities.rotateSession({
      sessionId,
      presentedHash: this.hashToken(refreshToken),
      nextSessionId,
      nextHash: this.hashToken(nextToken),
      expiresAt: refreshExpiresAt,
      metadata,
    });
    if (result.status !== 'rotated') throw this.invalidSession();
    return {
      principal: result.principal,
      tokens: await this.tokens(result.principal, nextToken, refreshExpiresAt),
    };
  }

  async switchRole(
    principal: SessionPrincipal,
    role: AppRole,
    metadata: SessionMetadata,
  ): Promise<{ principal: SessionPrincipal; accessToken: string }> {
    if (!principal.roles.includes(role)) {
      throw new UnauthorizedException({
        code: 'ROLE_NOT_ASSIGNED',
        detail: 'The requested role is not assigned to this account.',
      });
    }
    const updated = await this.identities.changeActiveRole(
      principal,
      role,
      metadata,
    );
    return { principal: updated, accessToken: await this.accessToken(updated) };
  }

  logout(
    principal: SessionPrincipal,
    metadata: SessionMetadata,
  ): Promise<void> {
    return this.identities.revokeSession(principal, metadata);
  }

  metadata(input: {
    requestId: string;
    ip?: string;
    userAgent?: string;
  }): SessionMetadata {
    return {
      requestId: input.requestId,
      userAgent: input.userAgent?.slice(0, 500),
      ipHash: input.ip
        ? createHmac('sha256', this.secret).update(input.ip).digest('hex')
        : undefined,
    };
  }

  private async tokens(
    principal: SessionPrincipal,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<AuthTokens> {
    return {
      accessToken: await this.accessToken(principal),
      refreshToken,
      refreshExpiresAt,
    };
  }

  private accessToken(principal: SessionPrincipal): Promise<string> {
    return this.jwt.signAsync(
      { sub: principal.userId, sid: principal.sessionId },
      {
        expiresIn: this.accessTtlSeconds,
        issuer: 'burhanpedia-api',
        audience: 'burhanpedia-web',
      },
    );
  }

  private refreshToken(sessionId: string): string {
    return `${sessionId}.${randomBytes(32).toString('base64url')}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTtlDays * 86_400_000);
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_CREDENTIALS',
      detail: 'Email or password is incorrect.',
    });
  }

  private invalidSession(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_REFRESH_SESSION',
      detail: 'The refresh session is invalid or has been revoked.',
    });
  }
}
