export enum AppRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export interface SessionPrincipal {
  userId: string;
  sessionId: string;
  name: string;
  email: string;
  activeRole: AppRole;
  roles: AppRole[];
}

export interface SessionMetadata {
  requestId: string;
  userAgent?: string;
  ipHash?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}
