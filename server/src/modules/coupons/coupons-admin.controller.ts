import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { CouponsService } from './coupons.service.js';
import { couponInputSchema, couponUpdateSchema, type CouponInput, type CouponUpdate } from './coupons.schemas.js';

@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER)
export class CouponsAdminController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  @RequirePermissions('marketing:read')
  list() {
    return this.coupons.list();
  }

  @Post()
  @RequirePermissions('marketing:create')
  create(@Body(new ZodValidationPipe(couponInputSchema)) input: CouponInput) {
    return this.coupons.create(input);
  }

  @Patch(':id')
  @RequirePermissions('marketing:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(couponUpdateSchema)) input: CouponUpdate) {
    return this.coupons.update(id, input);
  }

  @Delete(':id')
  @RequirePermissions('marketing:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.remove(id);
  }
}
