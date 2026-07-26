import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole } from '../../modules/identity/domain/identity.types';
import { RolesGuard } from './roles.guard';

describe('RolesGuard authorization matrix', () => {
  const cases: Array<[AppRole, AppRole, boolean]> = [
    [AppRole.BUYER, AppRole.BUYER, true],
    [AppRole.SELLER, AppRole.SELLER, true],
    [AppRole.DRIVER, AppRole.DRIVER, true],
    [AppRole.ADMIN, AppRole.ADMIN, true],
    [AppRole.BUYER, AppRole.SELLER, false],
    [AppRole.SELLER, AppRole.ADMIN, false],
    [AppRole.DRIVER, AppRole.BUYER, false],
    [AppRole.ADMIN, AppRole.DRIVER, false],
  ];

  it.each(cases)(
    '%s requesting %s is allowed=%s',
    (active, required, allowed) => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([required]),
      } as unknown as Reflector;
      const guard = new RolesGuard(reflector);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ auth: { activeRole: active } }),
        }),
      } as unknown as ExecutionContext;

      if (allowed) expect(guard.canActivate(context)).toBe(true);
      else expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    },
  );
});
