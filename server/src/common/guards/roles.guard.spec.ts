import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { Roles, ROLES_METADATA_KEY } from '../decorators/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

function context(role: RoleEnum, authUserId = 'user-1') {
  const handler = () => undefined;
  class Controller {}
  Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)(Controller);
  return {
    getHandler: () => handler,
    getClass: () => Controller,
    switchToHttp: () => ({
      getRequest: () => ({ authUserId, authUserRole: role }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('reads roles metadata and accepts an administrator', () => {
    const requestContext = context(RoleEnum.ADMIN);
    expect(
      Reflect.getMetadata(ROLES_METADATA_KEY, requestContext.getClass()),
    ).toEqual([RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN]);
    expect(new RolesGuard(new Reflector()).canActivate(requestContext)).toBe(
      true,
    );
  });

  it('rejects customers and missing role metadata', () => {
    const guard = new RolesGuard(new Reflector());
    expect(() => guard.canActivate(context(RoleEnum.CUSTOMER))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(context(RoleEnum.ADMIN, ''))).toThrow(
      ForbiddenException,
    );
    const unconfigured = {
      getHandler: () => () => undefined,
      getClass: () => class Unconfigured {},
      switchToHttp: () => ({
        getRequest: () => ({
          authUserId: 'user-1',
          authUserRole: RoleEnum.ADMIN,
        }),
      }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(unconfigured)).toThrow(ForbiddenException);
  });
});
