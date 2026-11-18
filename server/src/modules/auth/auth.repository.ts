import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, RoleEnum, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { ChallengePurpose } from './challenge-purpose.js';
import { RedisAuthStore } from './redis-auth-store.service.js';

type Tx = Prisma.TransactionClient;

@Injectable()
export class AuthRepository {
  constructor(
    private readonly db: PrismaService,
    private readonly redis: RedisAuthStore,
  ) {}

  userByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }
  userByPhone(phone: string) {
    return this.db.user.findUnique({ where: { phone } });
  }
  async createCheckoutPhoneCustomer(phone: string, name: string) {
    try {
      return await this.db.user.create({
        data: {
          name,
          phone,
          role: RoleEnum.CUSTOMER,
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    } catch (error) {
      if (!this.isUniqueConflict(error)) throw error;
      return this.db.user.findUnique({ where: { phone } });
    }
  }
  markPhoneVerified(userId: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true, phoneVerifiedAt: new Date() },
    });
  }
  userById(id: string) {
    return this.db.user.findUnique({ where: { id } });
  }
  updateName(id: string, name: string) {
    return this.db.user.update({ where: { id }, data: { name } });
  }
  async permissionsForUser(userId: string, role: RoleEnum) {
    const now = new Date();
    const [roleGrants, userGrants] = await Promise.all([
      this.db.rolePermission.findMany({
        where: { role },
        select: { permission: { select: { key: true } } },
      }),
      this.db.userPermission.findMany({
        where: {
          userId,
          revokedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        select: { permission: { select: { key: true } } },
      }),
    ]);
    const permissions = new Set([
      ...roleGrants.map(({ permission }) => permission.key),
      ...userGrants.map(({ permission }) => permission.key),
    ]);
    if (role !== RoleEnum.CUSTOMER) permissions.add('session:read');
    return [...permissions].sort();
  }
  createEmailUser(email: string, passwordHash: string) {
    const name = email.split('@', 1)[0] || 'Customer';
    return this.db.user.create({ data: { name, email, passwordHash } });
  }
  updatePendingPassword(id: string, passwordHash: string) {
    return this.db.user.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { passwordHash },
    });
  }

  async verifyEmail(
    email: string,
    codeHash: string,
    passwordHash: string,
  ): Promise<User | null> {
    return this.db.$transaction(async (tx) => {
      const pending = await tx.user.findUnique({ where: { email } });
      if (
        !pending ||
        pending.emailVerifiedAt ||
        pending.passwordHash !== passwordHash
      )
        return null;
      const challenge = await this.redis.consumeChallenge(
        ChallengePurpose.VERIFY_EMAIL,
        email,
        codeHash,
        pending.id,
      );
      if (!challenge?.userId || challenge.userId !== pending.id) return null;
      return tx.user.update({
        where: { id: challenge.userId },
        data: { emailVerifiedAt: new Date(), isEmailVerified: true },
      });
    });
  }

  async completePhoneLogin(
    phone: string,
    codeHash: string,
  ): Promise<User | null> {
    const challenge = await this.redis.consumeChallenge(
      ChallengePurpose.PHONE_LOGIN,
      phone,
      codeHash,
    );
    if (!challenge) return null;
    try {
      return await this.db.$transaction(async (tx) => {
        const existing = await tx.user.findUnique({ where: { phone } });
        return (
          existing ??
          tx.user.create({
            data: {
              name: 'Customer',
              phone,
              phoneVerifiedAt: new Date(),
              isPhoneVerified: true,
            },
          })
        );
      });
    } catch (error) {
      if (!this.isUniqueConflict(error)) throw error;
      return this.db.user.findUnique({ where: { phone } });
    }
  }

  async createVerifiedPhoneCustomer(
    phone: string,
    name: string,
    codeHash: string,
    passwordHash: string,
  ): Promise<User | null> {
    const challenge = await this.redis.consumeChallenge(
      ChallengePurpose.CUSTOMER_PHONE_SIGNUP,
      phone,
      codeHash,
    );
    if (!challenge) return null;
    try {
      return await this.db.user.create({
        data: {
          name,
          phone,
          passwordHash,
          role: RoleEnum.CUSTOMER,
          phoneVerifiedAt: new Date(),
          isPhoneVerified: true,
        },
      });
    } catch (error) {
      if (!this.isUniqueConflict(error)) throw error;
      return null;
    }
  }

  async verifyCustomerPhoneLogin(userId: string, phone: string, codeHash: string) {
    const challenge = await this.redis.consumeChallenge(
      ChallengePurpose.CUSTOMER_PHONE_LOGIN,
      phone,
      codeHash,
      userId,
    );
    return challenge ? this.db.user.findFirst({
      where: { id: userId, phone, phoneVerifiedAt: { not: null }, role: RoleEnum.CUSTOMER, status: 'ACTIVE' },
    }) : null;
  }

  async resetCustomerPhonePassword(
    userId: string,
    phone: string,
    codeHash: string,
    passwordHash: string,
    authVersion: number,
  ): Promise<boolean> {
    const challenge = await this.redis.consumeChallenge(
      ChallengePurpose.RESET_PHONE_PASSWORD,
      phone,
      codeHash,
      userId,
    );
    if (!challenge) return false;
    const changed = await this.db.user.updateMany({
      where: {
        id: userId,
        phone,
        phoneVerifiedAt: { not: null },
        role: RoleEnum.CUSTOMER,
        status: 'ACTIVE',
        authVersion,
      },
      data: { passwordHash, authVersion: { increment: 1 } },
    });
    if (changed.count !== 1) return false;
    await this.redis.revokeUserSessions(userId);
    return true;
  }

  async linkEmail(
    userId: string,
    email: string,
    codeHash: string,
    passwordHash: string,
  ): Promise<User | null> {
    try {
      return await this.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || (user.email && user.email !== email))
          throw new ConflictException('Email already linked');
        const challenge = await this.redis.consumeChallenge(
          ChallengePurpose.LINK_EMAIL,
          email,
          codeHash,
          userId,
        );
        if (!challenge) return null;
        return tx.user.update({
          where: { id: userId },
          data: {
            email,
            emailVerifiedAt: new Date(),
            isEmailVerified: true,
            passwordHash,
          },
        });
      });
    } catch (error) {
      if (this.isUniqueConflict(error))
        throw new ConflictException('Email already in use');
      throw error;
    }
  }

  async linkPhone(
    userId: string,
    phone: string,
    codeHash: string,
  ): Promise<User | null> {
    try {
      return await this.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || (user.phone && user.phone !== phone))
          throw new ConflictException('Phone already linked');
        const challenge = await this.redis.consumeChallenge(
          ChallengePurpose.LINK_PHONE,
          phone,
          codeHash,
          userId,
        );
        if (!challenge) return null;
        return tx.user.update({
          where: { id: userId },
          data: { phone, phoneVerifiedAt: new Date(), isPhoneVerified: true },
        });
      });
    } catch (error) {
      if (this.isUniqueConflict(error))
        throw new ConflictException('Phone already in use');
      throw error;
    }
  }

  async resetPassword(
    email: string,
    codeHash: string,
    passwordHash: string,
  ): Promise<boolean> {
    const userId = await this.db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });
      if (!user) return null;
      const challenge = await this.redis.consumeChallenge(
        ChallengePurpose.RESET_PASSWORD,
        email,
        codeHash,
        user.id,
      );
      if (!challenge?.userId || challenge.userId !== user.id) return null;
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, authVersion: { increment: 1 } },
      });
      return user.id;
    });
    if (!userId) return false;
    await this.redis.revokeUserSessions(userId);
    return true;
  }
  private isUniqueConflict(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
