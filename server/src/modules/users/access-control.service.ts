import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, RoleEnum } from '@prisma/client';
import type { UpdateRolePermissions } from './dto/access-control.schemas.js';
import { PrismaService } from '../../database/prisma.service.js';

const assignableRoles = [
  RoleEnum.ADMIN,
  RoleEnum.MANAGER,
  RoleEnum.SUPPORT,
] as const;
const systemPermissions = ['session:read'];

@Injectable()
export class AccessControlService {
  constructor(private readonly db: PrismaService) {}

  async listRolePermissions(actorId: string, actorRole: RoleEnum) {
    await this.assertPermission(actorId, actorRole, 'settings:read');
    const [catalog, grants] = await Promise.all([
      this.db.permission.findMany({
        where: { key: { notIn: systemPermissions } },
        select: { key: true, resource: true, action: true, description: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      }),
      this.db.rolePermission.findMany({
        where: { role: { in: [RoleEnum.SUPER_ADMIN, ...assignableRoles] } },
        select: { role: true, permission: { select: { key: true } } },
      }),
    ]);

    return {
      permissions: catalog,
      roles: [RoleEnum.SUPER_ADMIN, ...assignableRoles].map((role) => ({
        role,
        permissions: grants
          .filter((grant) => grant.role === role)
          .map(({ permission }) => permission.key)
          .filter((key) => !systemPermissions.includes(key))
          .sort(),
      })),
    };
  }

  async updateRolePermissions(
    role: RoleEnum,
    actorId: string,
    actorRole: RoleEnum,
    ipAddress: string,
    userAgent: string,
    input: UpdateRolePermissions,
  ) {
    if (role === RoleEnum.SUPER_ADMIN || role === RoleEnum.CUSTOMER) {
      throw new ForbiddenException('This role cannot be modified.');
    }
    await this.assertPermission(actorId, actorRole, 'settings:update');

    const uniqueKeys = [...new Set(input.permissions)];
    return this.db.$transaction(async (tx) => {
      const [actor, existing] = await Promise.all([
        tx.user.findUnique({ where: { id: actorId }, select: { email: true } }),
        tx.rolePermission.findMany({
          where: { role },
          select: { permission: { select: { key: true } } },
        }),
      ]);
      if (!actor) throw new NotFoundException('Administrator not found.');

      const currentKeys = existing.map(({ permission }) => permission.key);
      const nextKeys = [...new Set([...uniqueKeys, ...systemPermissions])];
      const permissionRecords = await tx.permission.findMany({
        where: { key: { in: nextKeys } },
        select: { id: true, key: true },
      });
      if (permissionRecords.length !== nextKeys.length) {
        const known = new Set(permissionRecords.map(({ key }) => key));
        throw new BadRequestException({
          message: 'One or more permissions are unknown.',
          issues: nextKeys
            .filter((key) => !known.has(key))
            .map((key) => ({
              path: 'permissions',
              message: `Unknown permission: ${key}`,
            })),
        });
      }

      const permissionIds = permissionRecords.map(({ id }) => id);
      await tx.rolePermission.deleteMany({ where: { role } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ role, permissionId })),
        skipDuplicates: true,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorEmail: actor.email ?? 'unknown',
          action: AuditAction.PERMISSION_CHANGE,
          resource: 'role',
          resourceId: role,
          oldData: { permissions: currentKeys } as Prisma.InputJsonValue,
          newData: { permissions: nextKeys } as Prisma.InputJsonValue,
          ipAddress,
          userAgent,
          status: 'SUCCESS',
        },
      });

      return { role, permissions: uniqueKeys.sort() };
    });
  }

  private async assertPermission(userId: string, role: RoleEnum, key: string) {
    const now = new Date();
    const [roleGrant, userGrant] = await Promise.all([
      this.db.rolePermission.findFirst({
        where: { role, permission: { key } },
        select: { id: true },
      }),
      this.db.userPermission.findFirst({
        where: {
          userId,
          revokedAt: null,
          permission: { key },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { id: true },
      }),
    ]);
    if (!roleGrant && !userGrant) {
      throw new ForbiddenException('Required permission access denied.');
    }
  }
}
