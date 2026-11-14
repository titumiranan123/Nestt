import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { StaffService } from './staff.service.js';
import {
  createStaffSchema,
  listStaffSchema,
  resetStaffPasswordSchema,
  updateStaffSchema,
} from './dto/staff.schemas.js';
import type {
  CreateStaff,
  ListStaff,
  ResetStaffPassword,
  UpdateStaff,
} from './dto/staff.schemas.js';

@Controller('admin/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(
    @Req() request: AuthRequest,
    @Query(new ZodValidationPipe(listStaffSchema)) query: ListStaff,
  ) {
    return this.staff.list(request.authUserId, request.authUserRole, query);
  }

  @Post()
  create(
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(createStaffSchema)) body: CreateStaff,
  ) {
    return this.staff.create(
      request.authUserId,
      request.authUserRole,
      request.ip ?? 'unknown',
      request.headers['user-agent'] ?? 'unknown',
      body,
    );
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(updateStaffSchema)) body: UpdateStaff,
  ) {
    return this.staff.update(
      id,
      request.authUserId,
      request.authUserRole,
      request.ip ?? 'unknown',
      request.headers['user-agent'] ?? 'unknown',
      body,
    );
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthRequest,
    @Body(new ZodValidationPipe(resetStaffPasswordSchema))
    body: ResetStaffPassword,
  ) {
    return this.staff.resetPassword(
      id,
      request.authUserId,
      request.authUserRole,
      request.ip ?? 'unknown',
      request.headers['user-agent'] ?? 'unknown',
      body,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() request: AuthRequest) {
    return this.staff.remove(
      id,
      request.authUserId,
      request.authUserRole,
      request.ip ?? 'unknown',
      request.headers['user-agent'] ?? 'unknown',
    );
  }
}
