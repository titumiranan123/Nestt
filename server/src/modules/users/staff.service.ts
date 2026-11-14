import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma, RoleEnum, UserStatus } from '@prisma/client';
import { AuthCrypto } from '../auth/services/auth-crypto.service.js';
import type {
  CreateStaff,
  ListStaff,
  ResetStaffPassword,
  UpdateStaff,
} from './dto/staff.schemas.js';
import { PrismaService } from '../../database/prisma.service.js';
import { RedisAuthStore } from '../auth/redis-auth-store.service.js';

const staffRoles = [
  RoleEnum.SUPER_ADMIN,
  RoleEnum.ADMIN,
  RoleEnum.MANAGER,
  RoleEnum.SUPPORT,
];
const publicStaffSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class StaffService {
  constructor(
    private readonly db: PrismaService,
    private readonly crypto: AuthCrypto,
    private readonly redis: RedisAuthStore,
  ) {}

  async list(actorId: string, actorRole: RoleEnum, query: ListStaff) {
    await this.assertPermission(actorId, actorRole, 'staff:read');
    const where: Prisma.UserWhereInput = {
      role: query.role ?? { in: staffRoles },
      status: query.status ?? { in: [UserStatus.ACTIVE, UserStatus.SUSPENDED] },
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: publicStaffSelect,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.db.user.count({ where }),
    ]);
    const staffWhere: Prisma.UserWhereInput = {
      role: { in: staffRoles },
      status: { not: UserStatus.BANNED },
    };
    const [totalStaff, active, admins, managers] = await Promise.all([
      this.db.user.count({ where: staffWhere }),
      this.db.user.count({
        where: { ...staffWhere, status: UserStatus.ACTIVE },
      }),
      this.db.user.count({
        where: {
          ...staffWhere,
          role: { in: [RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN] },
        },
      }),
      this.db.user.count({ where: { ...staffWhere, role: RoleEnum.MANAGER } }),
    ]);
    const lastLogins = await Promise.all(
      items.map(
        async (user) =>
          [user.id, await this.redis.lastLoginAt(user.id)] as const,
      ),
    );
    const lastLoginByUserId = new Map(lastLogins);
    return {
      items: items.map((user) =>
        this.toStaff(user, lastLoginByUserId.get(user.id) ?? null),
      ),
      total,
      page: query.page,
      limit: query.limit,
      pages: Math.ceil(total / query.limit),
      summary: { total: totalStaff, active, admins, managers },
    };
  }

  async create(
    actorId: string,
    actorRole: RoleEnum,
    ipAddress: string,
    userAgent: string,
    input: CreateStaff,
  ) {
    await this.assertPermission(actorId, actorRole, 'staff:create');
    const passwordHash = await this.crypto.hashPassword(input.password);
    try {
      return await this.db.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            name: input.name,
            email: input.email,
            passwordHash,
            phone: input.phone || null,
            role: input.role,
            status: input.status,
            isEmailVerified: input.verified,
            emailVerifiedAt: input.verified ? new Date() : null,
          },
          select: publicStaffSelect,
        });
        await this.audit(
          tx,
          actorId,
          AuditAction.CREATE,
          created.id,
          ipAddress,
          userAgent,
          null,
          {
            role: created.role,
            status: created.status,
          },
        );
        return this.toStaff(created);
      });
    } catch (error) {
      this.throwUniqueConflict(error);
      throw error;
    }
  }

  async update(
    id: string,
    actorId: string,
    actorRole: RoleEnum,
    ipAddress: string,
    userAgent: string,
    input: UpdateStaff,
  ) {
    await this.assertPermission(actorId, actorRole, 'staff:update');
    const existing = await this.findStaff(id);
    if (existing.role === RoleEnum.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin accounts cannot be edited here.',
      );
    }
    if (
      id === actorId &&
      (input.role !== undefined || input.status !== undefined)
    ) {
      throw new BadRequestException(
        'You cannot change your own role or status.',
      );
    }
    const emailChanged =
      input.email !== undefined && input.email !== existing.email;
    const accessChanged =
      (input.status !== undefined && input.status !== existing.status) ||
      (input.role !== undefined && input.role !== existing.role);
    const data: Prisma.UserUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.verified !== undefined
        ? {
            isEmailVerified: input.verified,
            emailVerifiedAt: input.verified ? new Date() : null,
          }
        : emailChanged
          ? { isEmailVerified: false, emailVerifiedAt: null }
          : {}),
      ...(accessChanged ? { authVersion: { increment: 1 } } : {}),
    };
    try {
      const updated = await this.db.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id },
          data,
          select: publicStaffSelect,
        });
        const action =
          input.role !== undefined && input.role !== existing.role
            ? AuditAction.ROLE_CHANGE
            : AuditAction.UPDATE;
        await this.audit(
          tx,
          actorId,
          action,
          id,
          ipAddress,
          userAgent,
          {
            name: existing.name,
            email: existing.email,
            role: existing.role,
            status: existing.status,
          },
          {
            name: updated.name,
            email: updated.email,
            role: updated.role,
            status: updated.status,
          },
        );
        return updated;
      });
      if (accessChanged) await this.redis.revokeUserSessions(id);
      return this.toStaff(updated, await this.redis.lastLoginAt(id));
    } catch (error) {
      this.throwUniqueConflict(error);
      throw error;
    }
  }

  async resetPassword(
    id: string,
    actorId: string,
    actorRole: RoleEnum,
    ipAddress: string,
    userAgent: string,
    input: ResetStaffPassword,
  ) {
    await this.assertPermission(actorId, actorRole, 'staff:update');
    const existing = await this.findStaff(id);
    if (existing.role === RoleEnum.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin passwords cannot be reset here.',
      );
    }
    if (id === actorId)
      throw new BadRequestException(
        'Use account recovery to reset your own password.',
      );
    const passwordHash = await this.crypto.hashPassword(input.password);
    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { passwordHash, authVersion: { increment: 1 } },
      });
      await this.audit(
        tx,
        actorId,
        AuditAction.UPDATE,
        id,
        ipAddress,
        userAgent,
        { operation: 'password-reset' },
        { operation: 'password-reset' },
      );
    });
    await this.redis.revokeUserSessions(id);
    return { id, passwordReset: true };
  }

  async remove(
    id: string,
    actorId: string,
    actorRole: RoleEnum,
    ipAddress: string,
    userAgent: string,
  ) {
    await this.assertPermission(actorId, actorRole, 'staff:delete');
    if (id === actorId)
      throw new BadRequestException('You cannot delete your own account.');
    const existing = await this.findStaff(id);
    if (existing.role === RoleEnum.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Super Admin accounts cannot be deleted here.',
      );
    }
    await this.db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: UserStatus.BANNED, authVersion: { increment: 1 } },
      });
      await this.audit(
        tx,
        actorId,
        AuditAction.DELETE,
        id,
        ipAddress,
        userAgent,
        { role: existing.role, status: existing.status },
        { role: existing.role, status: UserStatus.BANNED, deactivated: true },
      );
    });
    await this.redis.revokeUserSessions(id);
  }

  private async findStaff(id: string) {
    const user = await this.db.user.findFirst({
      where: {
        id,
        role: { in: staffRoles },
        status: { not: UserStatus.BANNED },
      },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (!user) throw new NotFoundException('Staff member not found.');
    return user;
  }

  private toStaff(
    user: Prisma.UserGetPayload<{ select: typeof publicStaffSelect }>,
    lastLoginAt: Date | null = null,
  ) {
    return {
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
      role: user.role,
      status:
        user.status === UserStatus.ACTIVE
          ? UserStatus.ACTIVE
          : UserStatus.SUSPENDED,
      verified: user.emailVerifiedAt !== null,
      lastActive: lastLoginAt?.toISOString() ?? 'Never',
      joinedAt: user.createdAt.toISOString(),
    };
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
    if (!roleGrant && !userGrant)
      throw new ForbiddenException('Required permission access denied.');
  }

  private async audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    action: AuditAction,
    targetId: string,
    ipAddress: string,
    userAgent: string,
    oldData: Prisma.InputJsonValue | null,
    newData: Prisma.InputJsonValue,
  ) {
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { email: true },
    });
    if (!actor) throw new NotFoundException('Administrator not found.');
    await tx.auditLog.create({
      data: {
        actorId,
        actorEmail: actor.email ?? 'unknown',
        targetId,
        action,
        resource: 'staff',
        resourceId: targetId,
        oldData: oldData ?? Prisma.JsonNull,
        newData,
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      },
    });
  }

  private throwUniqueConflict(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Email or phone number is already in use.');
    }
  }
}
