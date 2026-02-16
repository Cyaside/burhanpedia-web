import { Request } from 'express';

export interface JwtPayload {
  sub: number;
  email: string;
  role?: string;
}

export interface JwtUser {
  id: number;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: JwtUser;
}
