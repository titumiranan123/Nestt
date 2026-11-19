import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { AccessControlService } from './access-control.service.js';
import { updateRolePermissionsSchema } from './dto/access-control.schemas.js';
import type { UpdateRolePermissions } from './dto/access-control.schemas.js';

@Controller('admin/access/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccessControlController {
  constructor(private readonly accessControl: AccessControlService) {}

  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  list(@Req() request: AuthRequest) {
    return this.accessControl.listRolePermissions(
      request.authUserId,
      request.authUserRole,
    );
  }

  @Get(':role/audit')
  @Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN)
  audit(
    @Param('role', new ParseEnumPipe(RoleEnum)) role: RoleEnum,
    @Req() request: AuthRequest,
  ) {
    return this.accessControl.listRoleAudit(
      role,
      request.authUserId,
      request.authUserRole,
    );
  }

  @Put(':role/permissions')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleEnum.SUPER_ADMIN)
  update(
    @Param('role', new ParseEnumPipe(RoleEnum)) role: RoleEnum,
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(updateRolePermissionsSchema))
    body: UpdateRolePermissions,
  ) {
    return this.accessControl.updateRolePermissions(
      role,
      request.authUserId,
      request.authUserRole,
      request.ip ?? 'unknown',
      request.headers['user-agent'] ?? 'unknown',
      body,
    );
  }
}
