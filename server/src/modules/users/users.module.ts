import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AccessControlController } from './access-control.controller.js';
import { AccessControlService } from './access-control.service.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AccessControlController, StaffController, CustomersController],
  providers: [
    AccessControlService,
    StaffService,
    CustomersService,
    RolesGuard,
    PermissionsGuard,
    Reflector,
  ],
})
export class UsersModule {}
