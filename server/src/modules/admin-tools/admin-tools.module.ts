import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { AdminToolsController } from './admin-tools.controller.js';
import { AdminToolsService } from './admin-tools.service.js';

@Module({ imports: [AuthModule], controllers: [AdminToolsController], providers: [AdminToolsService, JwtAuthGuard, RolesGuard, PermissionsGuard] })
export class AdminToolsModule {}
