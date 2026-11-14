import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { AccessControlController } from './access-control.controller.js';
import { AccessControlService } from './access-control.service.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AccessControlController, StaffController],
  providers: [AccessControlService, StaffService, RolesGuard, Reflector],
})
export class UsersModule {}
