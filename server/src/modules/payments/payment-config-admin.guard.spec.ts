import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PaymentConfigAdminGuard } from './payment-config-admin.guard.js';

const reflector = {
  getAllAndOverride: () => [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN],
} as unknown as Reflector;

function context(authUserId?: string, authUserRole?: RoleEnum) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ authUserId, authUserRole }) }),
  } as unknown as import('@nestjs/common').ExecutionContext;
}

describe('PaymentConfigAdminGuard', () => {
  it('allows only active admin roles to manage payment credentials', () => {
    const guard = new PaymentConfigAdminGuard(reflector);
    expect(guard.canActivate(context('user-1', RoleEnum.ADMIN))).toBe(true);
    expect(guard.canActivate(context('user-2', RoleEnum.SUPER_ADMIN))).toBe(
      true,
    );
    expect(() =>
      guard.canActivate(context('user-3', RoleEnum.MANAGER)),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(context('user-4', RoleEnum.CUSTOMER)),
    ).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context())).toThrow(ForbiddenException);
  });
});
