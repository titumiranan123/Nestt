import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import {
  JwtAuthGuard,
  type AuthRequest,
} from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  stockAdjustmentSchema,
  stockThresholdSchema,
} from './inventory.schemas.js';
import type {
  StockAdjustmentInput,
  StockThresholdInput,
} from './inventory.schemas.js';
import { InventoryService } from './inventory.service.js';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class InventoryAdminController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:read')
  list() {
    return this.inventory.list();
  }

  @Get('adjustments')
  @RequirePermissions('inventory:update')
  adjustments() {
    return this.inventory.adjustments();
  }

  @Post('adjustments')
  @RequirePermissions('inventory:update')
  record(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(stockAdjustmentSchema))
    input: StockAdjustmentInput,
  ) {
    return this.inventory.record(req.authUserId, input);
  }

  @Patch('variants/:id/threshold')
  @RequirePermissions('inventory:update')
  setThreshold(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(stockThresholdSchema))
    input: StockThresholdInput,
  ) {
    return this.inventory.setThreshold(id, input.threshold);
  }
}
