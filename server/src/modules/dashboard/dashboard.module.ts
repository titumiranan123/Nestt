import { Module } from '@nestjs/common';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { DashboardAdminController } from './dashboard-admin.controller.js';
import { DashboardRepository } from './dashboard.repository.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [AuthModule],
  controllers: [DashboardAdminController],
  providers: [
    DashboardService,
    DashboardRepository,
    PermissionsGuard,
    RolesGuard,
  ],
})
export class DashboardModule {}
