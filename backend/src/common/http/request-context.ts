import { Request } from 'express';

export interface RequestContext extends Request {
  requestId: string;
}
