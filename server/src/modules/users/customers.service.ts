import {
  ConflictException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { AuditAction, Prisma, RoleEnum, UserStatus } from '@prisma/client';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
import { validateImage } from '../../common/utils/upload-image.util.js';
import type { MultipartFile } from '../../common/utils/upload-image.util.js';
import { PrismaService } from '../../database/prisma.service.js';
import { AuthCrypto } from '../auth/services/auth-crypto.service.js';
import { customerScope } from './customer-scope.js';
import { CUSTOMER_AVATAR_LIMIT } from './dto/customer.schemas.js';
import type {
  CreateCustomer,
  ExportCustomers,
  ListCustomers,
  UpdateCustomer,
} from './dto/customer.schemas.js';

const avatarTypes = ['image/jpeg', 'image/png'];
const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  customerLocation: true,
  customerAvatar: { select: { userId: true } },
  status: true,
  createdAt: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

const exportSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

function dateFilter({ from, to }: ExportCustomers): Prisma.UserWhereInput {
  if (!from && !to) return {};
  const end = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
  return {
    createdAt: {
      gte: from ? new Date(`${from}T00:00:00.000Z`) : undefined,
      lte: end,
    },
  };
}

function csvField(value: string | null): string {
  const text = value ?? '';
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly db: PrismaService,
    private readonly crypto: AuthCrypto,
  ) {}

  async list(query: ListCustomers) {
    const where: Prisma.UserWhereInput = {
      ...customerScope,
      ...dateFilter(query),
      status: query.status,
      isEmailVerified: query.verification
        ? query.verification === 'VERIFIED'
        : undefined,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
          ]
        : undefined,
    };
    const [users, total, all, active, verified] = await this.db.$transaction(
      [
        this.db.user.findMany({
          where,
          select: customerSelect,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip: (query.page - 1) * query.limit,
          take: query.limit,
        }),
        this.db.user.count({ where }),
        this.db.user.count({ where: customerScope }),
        this.db.user.count({
          where: { ...customerScope, status: UserStatus.ACTIVE },
        }),
        this.db.user.count({
          where: { ...customerScope, isEmailVerified: true },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    const reviewCounts = users.length
      ? await this.db.review.groupBy({
          by: ['userId'],
          where: { userId: { in: users.map(({ id }) => id) } },
          _count: { _all: true },
        })
      : [];
    const reviewsByUser = new Map(
      reviewCounts.map(({ userId, _count }) => [userId, _count._all]),
    );
    return {
      items: users.map(
        ({
          _count,
          customerAvatar,
          customerLocation,
          createdAt,
          email,
          phone,
          ...user
        }) => ({
          ...user,
          email: email ?? '',
          phone: phone ?? '',
          joinedAt: createdAt.toISOString().slice(0, 10),
          location: customerLocation ?? '',
          avatarPath: customerAvatar
            ? `/admin/customers/${user.id}/avatar`
            : null,
          orders: _count.orders,
          reviews: reviewsByUser.get(user.id) ?? 0,
        }),
      ),
      total,
      summary: { total: all, active, verified, restricted: all - active },
    };
  }

  async create(
    input: CreateCustomer,
    request: AuthRequest,
    file?: MultipartFile,
  ) {
    const avatar = this.avatarData(file);
    const passwordHash = await this.crypto.hashPassword(input.password);
    try {
      return await this.db.$transaction(async (tx) => {
        const customer = await tx.user.create({
          data: {
            role: RoleEnum.CUSTOMER,
            name: input.name,
            email: input.email,
            phone: input.phone,
            status: input.status,
            customerLocation: input.location,
            passwordHash,
            ...this.verification(
              input.email,
              input.isEmailVerified,
              input.phone,
              input.isPhoneVerified,
            ),
            customerAvatar: avatar ? { create: avatar } : undefined,
          },
          select: { id: true },
        });
        await this.audit(tx, request, customer.id, AuditAction.CREATE);
        return customer;
      });
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'A user already uses this email or phone number.',
      });
    }
  }

  async update(
    id: string,
    input: UpdateCustomer,
    request: AuthRequest,
    file?: MultipartFile,
  ) {
    const avatar = this.avatarData(file);
    try {
      return await this.db.$transaction(async (tx) => {
        const current = await tx.user.findUnique({
          where: { id, ...customerScope },
          select: {
            email: true,
            phone: true,
            updatedAt: true,
            status: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
          },
        });
        if (!current) throw new NotFoundException('Customer was not found.');
        const email = input.email === undefined ? current.email : input.email;
        const phone = input.phone === undefined ? current.phone : input.phone;
        const emailChanged = email !== current.email;
        const phoneChanged = phone !== current.phone;
        const statusChanged =
          input.status !== undefined && input.status !== current.status;
        const verificationRevoked =
          (input.isEmailVerified === false && !!current.emailVerifiedAt) ||
          (input.isPhoneVerified === false && !!current.phoneVerifiedAt);
        const result = await tx.user.update({
          where: { id, ...customerScope, updatedAt: current.updatedAt },
          data: {
            name: input.name,
            email: input.email,
            phone: input.phone,
            status: input.status,
            customerLocation: input.location,
            ...this.verification(
              email,
              input.isEmailVerified ??
                (!emailChanged && !!current.emailVerifiedAt),
              phone,
              input.isPhoneVerified ??
                (!phoneChanged && !!current.phoneVerifiedAt),
              emailChanged ? null : current.emailVerifiedAt,
              phoneChanged ? null : current.phoneVerifiedAt,
            ),
            authVersion:
              emailChanged ||
              phoneChanged ||
              statusChanged ||
              verificationRevoked
                ? { increment: 1 }
                : undefined,
            customerAvatar: avatar
              ? { upsert: { create: avatar, update: avatar } }
              : undefined,
          },
          select: { id: true, status: true },
        });
        await this.audit(
          tx,
          request,
          id,
          AuditAction.UPDATE,
          { status: current.status },
          { status: result.status },
        );
        return result;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new ConflictException(
          'The customer changed before the update could be saved. Refresh and try again.',
        );
      }
      throwMappedPrismaError(error, {
        unique: 'A user already uses this email or phone number.',
      });
    }
  }

  async remove(id: string, request: AuthRequest) {
    try {
      await this.db.$transaction(async (tx) => {
        await tx.user.update({
          where: { id, ...customerScope },
          data: {
            customerDeletedAt: new Date(),
            status: UserStatus.BANNED,
            authVersion: { increment: 1 },
            email: null,
            phone: null,
            passwordHash: null,
            customerLocation: null,
            ...this.verification(null, false, null, false),
          },
          select: { id: true },
        });
        await tx.customerAvatar.deleteMany({ where: { userId: id } });
        await this.audit(tx, request, id, AuditAction.DELETE);
      });
    } catch (error) {
      throwMappedPrismaError(error, { notFound: 'Customer was not found.' });
    }
  }

  async avatar(id: string) {
    const avatar = await this.db.customerAvatar.findFirst({
      where: { userId: id, user: customerScope },
      select: { bytes: true, mimeType: true },
    });
    if (!avatar) throw new NotFoundException('Profile photo was not found.');
    return avatar;
  }

  async *exportCsv(query: ExportCustomers) {
    const where = { ...customerScope, ...dateFilter(query) };
    yield 'id,name,email,phone,status,joined\r\n';
    let previousId: string | undefined;
    while (true) {
      const rows: Prisma.UserGetPayload<{ select: typeof exportSelect }>[] =
        await this.db.user.findMany({
          where: { ...where, id: previousId ? { gt: previousId } : undefined },
          select: exportSelect,
          orderBy: { id: 'asc' },
          take: 500,
        });
      for (const user of rows) {
        yield [
          user.id,
          user.name,
          user.email,
          user.phone,
          user.status,
          user.createdAt.toISOString().slice(0, 10),
        ]
          .map(csvField)
          .join(',') + '\r\n';
      }
      if (rows.length < 500) return;
      previousId = rows.at(-1)?.id;
    }
  }

  private avatarData(file?: MultipartFile) {
    if (!file) return undefined;
    const avatar = validateImage(file, avatarTypes);
    if (avatar.size > CUSTOMER_AVATAR_LIMIT)
      throw new PayloadTooLargeException(
        'Profile photos must be 5 MB or smaller.',
      );
    return { mimeType: avatar.mimetype, bytes: avatar.buffer };
  }

  private verification(
    email: string | null,
    emailVerified: boolean,
    phone: string | null,
    phoneVerified: boolean,
    emailAt: Date | null = null,
    phoneAt: Date | null = null,
  ) {
    const isEmailVerified = !!email && emailVerified;
    const isPhoneVerified = !!phone && phoneVerified;
    return {
      isEmailVerified,
      isPhoneVerified,
      emailVerifiedAt: isEmailVerified ? (emailAt ?? new Date()) : null,
      phoneVerifiedAt: isPhoneVerified ? (phoneAt ?? new Date()) : null,
    };
  }

  private async audit(
    tx: Prisma.TransactionClient,
    request: AuthRequest,
    id: string,
    action: AuditAction,
    oldData?: Prisma.InputJsonValue,
    newData?: Prisma.InputJsonValue,
  ) {
    const actor = await tx.user.findUniqueOrThrow({
      where: { id: request.authUserId },
      select: { email: true },
    });
    await tx.auditLog.create({
      data: {
        actorId: request.authUserId,
        actorEmail: actor.email ?? 'unknown',
        targetId: id,
        resource: 'customer',
        resourceId: id,
        action,
        oldData,
        newData,
        status: 'SUCCESS',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });
  }
}
