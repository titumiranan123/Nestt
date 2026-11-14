import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { Reflector } from '@nestjs/core';
import { BlogAdminGuard } from './blog-admin.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { BlogsAdminController } from './blogs-admin.controller.js';
import { BlogsController } from './blogs.controller.js';
import { BlogsRepository } from './blogs.repository.js';
import { BlogsService } from './blogs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [BlogsController, BlogsAdminController],
  providers: [BlogsRepository, BlogsService, BlogAdminGuard, PermissionsGuard, Reflector],
})
export class BlogsModule {}
