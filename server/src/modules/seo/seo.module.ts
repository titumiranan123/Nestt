import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { SeoAdminController } from './seo-admin.controller.js';
import { SeoController } from './seo.controller.js';
import { SeoRepository } from './seo.repository.js';
import { SeoService } from './seo.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SeoController, SeoAdminController],
  providers: [SeoRepository, SeoService, RolesGuard, PermissionsGuard, Reflector],
})
export class SeoModule {}
