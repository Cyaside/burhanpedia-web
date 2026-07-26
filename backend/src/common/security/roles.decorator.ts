import { SetMetadata } from '@nestjs/common';
import { AppRole } from '../../modules/identity/domain/identity.types';

export const REQUIRED_ROLES_KEY = 'burhanpedia:required-roles';
export const RequireRoles = (...roles: AppRole[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
