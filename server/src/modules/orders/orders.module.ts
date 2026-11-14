import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { OrdersAdminController } from './orders-admin.controller.js';
import { OrdersController } from './orders.controller.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersRepository, OrdersService, RolesGuard, PermissionsGuard, Reflector],
})
export class OrdersModule {}
