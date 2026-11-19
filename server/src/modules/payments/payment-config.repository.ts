import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

const PAYMENT_CONFIG_ID = '00000000-0000-4000-8000-000000000002';

@Injectable()
export class PaymentConfigRepository {
  constructor(private readonly db: PrismaService) {}

  getAll() {
    return this.db.paymentConfig.findUnique({
      where: { id: PAYMENT_CONFIG_ID },
      select: { ssl: { select: { status: true, updatedAt: true } } },
    });
  }

  getSsl() {
    return this.db.sSLConfig.findUnique({
      where: { paymentConfigId: PAYMENT_CONFIG_ID },
    });
  }

  saveSsl(data: { storeId?: string; storePass?: string; status?: boolean }) {
    return this.db.$transaction(async (tx) => {
      await tx.paymentConfig.upsert({
        where: { id: PAYMENT_CONFIG_ID },
        create: { id: PAYMENT_CONFIG_ID },
        update: { updatedAt: new Date() },
      });
      const where = { paymentConfigId: PAYMENT_CONFIG_ID };
      const select = { status: true, updatedAt: true };
      if (data.storeId !== undefined && data.storePass !== undefined) {
        return tx.sSLConfig.upsert({
          where,
          create: {
            ...where,
            storeId: data.storeId,
            storePass: data.storePass,
            status: data.status ?? false,
          },
          update: data,
          select,
        });
      }
      try {
        return await tx.sSLConfig.update({ where, data, select });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new ConflictException(
            'Enter both the SSLCommerz Store ID and Store Password to configure the gateway.',
          );
        }
        throw error;
      }
    });
  }
}
