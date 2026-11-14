import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { Reflector } from '@nestjs/core';
import { ConfigModule } from '../../config/config.module.js';
import { PaymentConfigAdminController } from './payment-config-admin.controller.js';
import { PaymentConfigAdminGuard } from './payment-config-admin.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { PaymentConfigCryptoService } from './payment-config-crypto.service.js';
import { PaymentConfigRepository } from './payment-config.repository.js';
import { PaymentConfigService } from './payment-config.service.js';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [PaymentConfigAdminController],
  providers: [
    PaymentConfigCryptoService,
    PaymentConfigAdminGuard,
    PermissionsGuard,
    PaymentConfigRepository,
    PaymentConfigService,
    Reflector,
  ],
  exports: [PaymentConfigCryptoService, PaymentConfigService],
})
export class PaymentsModule {}
