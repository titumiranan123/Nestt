import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CouponsAdminController } from './coupons-admin.controller.js';
import { CouponsService } from './coupons.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CouponsAdminController],
  providers: [CouponsService, PermissionsGuard, RolesGuard],
})
export class CouponsModule {}
