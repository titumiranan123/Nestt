import { ConflictException, Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import type { SslConfigInput } from './dto/payment-config.schemas.js';
import { PaymentConfigCryptoService } from './payment-config-crypto.service.js';
import { PaymentConfigRepository } from './payment-config.repository.js';

@Injectable()
export class PaymentConfigService {
  constructor(
    private readonly repository: PaymentConfigRepository,
    private readonly crypto: PaymentConfigCryptoService,
  ) {}

  async getSettings() {
    const config = await this.repository.getAll();
    return {
      ssl: config?.ssl
        ? {
            status: config.ssl.status,
            credentialsConfigured: true,
            updatedAt: config.ssl.updatedAt,
          }
        : null,
    };
  }

  async saveSsl(input: SslConfigInput) {
    const saved = await this.repository.saveSsl({
      ...(input.storeId !== undefined && {
        storeId: this.crypto.encrypt(input.storeId),
      }),
      ...(input.storePass !== undefined && {
        storePass: this.crypto.encrypt(input.storePass),
      }),
      ...(input.status !== undefined && { status: input.status }),
    });
    return {
      status: saved.status,
      credentialsConfigured: true,
      updatedAt: saved.updatedAt,
    };
  }

  async getGatewayCredentials(method: PaymentMethod, allowDisabled = false) {
    if (method === PaymentMethod.CASH_ON_DELIVERY) {
      throw new ConflictException(
        'Cash on delivery does not use gateway credentials',
      );
    }
    if (method !== PaymentMethod.SSL_COMMERZ) {
      throw new ConflictException('Unsupported payment method');
    }

    const config = await this.repository.getSsl();
    if (!config || (!config.status && !allowDisabled))
      throw new ConflictException('SSLCommerz is not enabled');
    return {
      storeId: this.crypto.decrypt(config.storeId),
      storePass: this.crypto.decrypt(config.storePass),
    };
  }
}
