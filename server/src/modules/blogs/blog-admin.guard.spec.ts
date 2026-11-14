import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { BlogAdminGuard } from './blog-admin.guard.js';

const reflector = {
  getAllAndOverride: () => [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN],
} as unknown as Reflector;
const context = (request: object) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('BlogAdminGuard', () => {
  it('allows signed-in admin roles', () => {
    const guard = new BlogAdminGuard(reflector);
    expect(
      guard.canActivate(
        context({ authUserId: 'u1', authUserRole: RoleEnum.ADMIN }),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        context({ authUserId: 'u2', authUserRole: RoleEnum.SUPER_ADMIN }),
      ),
    ).toBe(true);
  });

  it('rejects missing users and non-admin roles', () => {
    const guard = new BlogAdminGuard(reflector);
    expect(() =>
      guard.canActivate(context({ authUserRole: RoleEnum.ADMIN })),
    ).toThrow(ForbiddenException);
    expect(() =>
      guard.canActivate(
        context({ authUserId: 'u1', authUserRole: RoleEnum.MANAGER }),
      ),
    ).toThrow(ForbiddenException);
  });
});
