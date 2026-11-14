import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

const PAYMENT_CONFIG_ID = '00000000-0000-4000-8000-000000000002';

@Injectable()
export class PaymentConfigRepository {
  constructor(private readonly db: PrismaService) {}

  getAll() {
    return this.db.paymentConfig.findUnique({
      where: { id: PAYMENT_CONFIG_ID },
      include: { ssl: true },
    });
  }

  getSsl() {
    return this.db.sSLConfig.findUnique({
      where: { paymentConfigId: PAYMENT_CONFIG_ID },
    });
  }

  saveSsl(data: { storeId: string; storePass: string; status: boolean }) {
    return this.db.$transaction(async (tx) => {
      await tx.paymentConfig.upsert({
        where: { id: PAYMENT_CONFIG_ID },
        create: { id: PAYMENT_CONFIG_ID },
        update: {},
      });
      return tx.sSLConfig.upsert({
        where: { paymentConfigId: PAYMENT_CONFIG_ID },
        create: { ...data, paymentConfigId: PAYMENT_CONFIG_ID },
        update: data,
      });
    });
  }
}
