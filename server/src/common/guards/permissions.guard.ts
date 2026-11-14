import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service.js';
import type { AuthRequest } from './jwt-auth.guard.js';
import { REQUIRED_PERMISSIONS } from '../decorators/permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly db: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!required?.length || !request.authUserId || !request.authUserRole) {
      throw new ForbiddenException('Required permission access denied.');
    }

    const now = new Date();
    const [roleGrants, userGrants] = await Promise.all([
      this.db.rolePermission.findMany({
        where: {
          role: request.authUserRole,
          permission: { key: { in: required } },
        },
        select: { permission: { select: { key: true } } },
      }),
      this.db.userPermission.findMany({
        where: {
          userId: request.authUserId,
          revokedAt: null,
          permission: { key: { in: required } },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { permission: { select: { key: true } } },
      }),
    ]);
    const granted = new Set([
      ...roleGrants.map(({ permission }) => permission.key),
      ...userGrants.map(({ permission }) => permission.key),
    ]);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException('Required permission access denied.');
    }
    return true;
  }
}
