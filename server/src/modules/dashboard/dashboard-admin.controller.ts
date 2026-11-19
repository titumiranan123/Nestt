import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { z } from 'zod';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { dashboardPeriods, type DashboardPeriod } from './dashboard-period.js';
import { DashboardService } from './dashboard.service.js';

const periodPipe = new ZodValidationPipe(
  z.enum(dashboardPeriods).default('30d'),
);

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class DashboardAdminController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard:read')
  overview(@Query('period', periodPipe) period: DashboardPeriod) {
    return this.dashboard.overview(period);
  }

  @Get('recent-orders')
  @RequirePermissions('dashboard:read', 'orders:read')
  recentOrders(@Query('period', periodPipe) period: DashboardPeriod) {
    return this.dashboard.recentOrders(period);
  }

  @Get('inventory-alerts')
  @RequirePermissions('dashboard:read', 'inventory:read')
  inventoryAlerts() {
    return this.dashboard.inventoryAlerts();
  }
}
