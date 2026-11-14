import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { ProductsAdminController } from './products-admin.controller.js';
import { ProductsCrudAdminController } from './products-crud-admin.controller.js';
import { ProductsPublicController } from './products-public.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProductsPublicController, ProductsAdminController, ProductsCrudAdminController],
  providers: [ProductsService, RolesGuard, PermissionsGuard, Reflector],
})
export class ProductsModule {}
