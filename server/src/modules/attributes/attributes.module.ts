import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { AttributesAdminController } from './attributes-admin.controller.js';
import { AttributesController } from './attributes.controller.js';
import { AttributesRepository } from './attributes.repository.js';
import { AttributesService } from './attributes.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AttributesController, AttributesAdminController],
  providers: [AttributesRepository, AttributesService, RolesGuard, PermissionsGuard, Reflector],
})
export class AttributesModule {}
