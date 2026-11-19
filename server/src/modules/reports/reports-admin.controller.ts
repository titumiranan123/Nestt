import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { ReportsService } from './reports.service.js';
import { reportQuerySchema, type ReportQuery } from './reports.schemas.js';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class ReportsAdminController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales')
  @RequirePermissions('reports:read')
  sales(@Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery) {
    return this.reports.sales(query);
  }

  @Get('products')
  @RequirePermissions('reports:read')
  products(@Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery) {
    return this.reports.products(query);
  }

  @Get('inventory')
  @RequirePermissions('reports:read')
  inventory(@Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery) {
    return this.reports.inventory(query);
  }

  @Get('customers')
  @RequirePermissions('reports:read')
  customers(@Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery) {
    return this.reports.customers(query);
  }

  @Get('revenue')
  @RequirePermissions('reports:read')
  revenue(@Query(new ZodValidationPipe(reportQuerySchema)) query: ReportQuery) {
    return this.reports.revenue(query);
  }
}
