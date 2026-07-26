import { RequestContext } from '../http/request-context';
import { SessionPrincipal } from '../../modules/identity/domain/identity.types';

export interface AuthenticatedRequest extends RequestContext {
  auth: SessionPrincipal;
  cookies: Record<string, string | undefined>;
}
