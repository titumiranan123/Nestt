import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { InventoryAdminController } from './inventory-admin.controller.js';
import { InventoryRepository } from './inventory.repository.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [AuthModule],
  controllers: [InventoryAdminController],
  providers: [
    InventoryRepository,
    InventoryService,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class InventoryModule {}
