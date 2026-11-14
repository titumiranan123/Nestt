import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  createProductSchema,
  createProductVariantSchema,
  updateProductSchema,
  updateProductVariantSchema,
} from './dto/create-product.schemas.js';
import type {
  CreateProduct,
  CreateProductVariant,
  UpdateProduct,
  UpdateProductVariant,
} from './dto/create-product.schemas.js';
import { ProductsService } from './products.service.js';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class ProductsCrudAdminController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermissions('products:read')
  list() {
    return this.products.listAdmin();
  }

  @Post()
  @RequirePermissions('products:create')
  create(@Body(new ZodValidationPipe(createProductSchema)) body: CreateProduct) {
    return this.products.createProduct(body);
  }

  @Get(':productId/variants')
  @RequirePermissions('products:read')
  listVariants(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.products.listVariants(productId);
  }

  @Post(':productId/variants')
  @RequirePermissions('products:create')
  createVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body(new ZodValidationPipe(createProductVariantSchema)) body: CreateProductVariant,
  ) {
    return this.products.createVariant(productId, body);
  }

  @Get(':productId/variants/:variantId')
  @RequirePermissions('products:read')
  getVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.products.getVariant(productId, variantId);
  }

  @Put(':productId/variants/:variantId')
  @RequirePermissions('products:update')
  updateVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(updateProductVariantSchema)) body: UpdateProductVariant,
  ) {
    return this.products.updateVariant(productId, variantId, body);
  }

  @Delete(':productId/variants/:variantId')
  @RequirePermissions('products:delete')
  removeVariant(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.products.removeVariant(productId, variantId);
  }

  @Get(':id')
  @RequirePermissions('products:read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.getProduct(id);
  }

  @Put(':id')
  @RequirePermissions('products:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProduct,
  ) {
    return this.products.updateProduct(id, body);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.removeProduct(id);
  }
}
