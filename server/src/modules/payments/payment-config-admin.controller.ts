import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  sslConfigSchema,
} from './dto/payment-config.schemas.js';
import type { SslConfigInput } from './dto/payment-config.schemas.js';
import { PaymentConfigService } from './payment-config.service.js';
import { PaymentConfigAdminGuard } from './payment-config-admin.guard.js';

@Controller('admin/payment-config')
@UseGuards(JwtAuthGuard, PaymentConfigAdminGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
export class PaymentConfigAdminController {
  constructor(private readonly paymentConfig: PaymentConfigService) {}

  @Get()
  @RequirePermissions('settings:read')
  getSettings() {
    return this.paymentConfig.getSettings();
  }

  @Put('ssl')
  @RequirePermissions('settings:update')
  saveSsl(@Body(new ZodValidationPipe(sslConfigSchema)) body: SslConfigInput) {
    return this.paymentConfig.saveSsl(body);
  }
}
