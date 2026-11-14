import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { CategoriesAdminController } from './categories-admin.controller.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController, CategoriesAdminController],
  providers: [CategoriesRepository, CategoriesService, RolesGuard, PermissionsGuard, Reflector],
})
export class CategoriesModule {}
