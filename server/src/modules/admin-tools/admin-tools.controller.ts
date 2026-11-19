import { Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { JwtAuthGuard, type AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AdminToolsService } from './admin-tools.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class AdminToolsController {
  constructor(private readonly tools: AdminToolsService) {}

  @Get('notifications') @RequirePermissions('marketing:read')
  notifications(@Req() req: AuthRequest) { return this.tools.notifications(req.authUserId); }
  @Patch('notifications/read-all') @RequirePermissions('marketing:update')
  readAll(@Req() req: AuthRequest) { return this.tools.markAllRead(req.authUserId); }
  @Patch('notifications/:id/read') @RequirePermissions('marketing:update')
  readOne(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) { return this.tools.markRead(req.authUserId, id); }

  @Get('audit-logs') @RequirePermissions('settings:read')
  auditLogs() { return this.tools.auditLogs(); }

  @Get('backups') @RequirePermissions('settings:read')
  backups() { return this.tools.backups(); }
  @Post('backups') @RequirePermissions('settings:download')
  createBackup(@Req() req: AuthRequest) { return this.tools.createBackup(req.authUserId); }
  @Get('backups/:id/download') @RequirePermissions('settings:download')
  async downloadBackup(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const file = await this.tools.backupFile(id);
    res.download(file.path, file.filename);
  }
}
