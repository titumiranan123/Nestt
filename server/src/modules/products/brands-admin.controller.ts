import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ProductsService } from './products.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { brandInputSchema, type BrandInput } from './dto/brand-input.schema.js';

@Controller('admin/brands')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class BrandsAdminController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermissions('products:read')
  list() {
    return this.products.listAdminBrands();
  }

  @Post()
  @RequirePermissions('products:create')
  create(@Body(new ZodValidationPipe(brandInputSchema)) input: BrandInput) { return this.products.createAdminBrand(input); }

  @Put(':id')
  @RequirePermissions('products:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodValidationPipe(brandInputSchema)) input: BrandInput) { return this.products.updateAdminBrand(id, input); }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.products.deleteAdminBrand(id); }
}
