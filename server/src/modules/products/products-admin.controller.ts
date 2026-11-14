import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { upsertARProductAssetSchema } from './dto/ar-product-asset.schemas.js';
import type { UpsertARProductAsset } from './dto/ar-product-asset.schemas.js';
import { ProductsService } from './products.service.js';

@Controller('admin/ar-assets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
export class ProductsAdminController {
  constructor(private readonly products: ProductsService) {}

  @Get('variants/:variantId')
  @RequirePermissions('products:read')
  get(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.products.getARAsset(variantId);
  }

  @Put('variants/:variantId')
  @RequirePermissions('products:update')
  upsert(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(upsertARProductAssetSchema)) body: UpsertARProductAsset,
  ) {
    return this.products.upsertARAsset(variantId, body);
  }
}
