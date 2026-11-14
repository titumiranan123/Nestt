import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { RoleEnum } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './dto/category.schemas.js';
import type { CreateCategory, UpdateCategory } from './dto/category.schemas.js';
import { CategoriesService } from './categories.service.js';

@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class CategoriesAdminController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @RequirePermissions('products:read')
  list() {
    return this.categories.listAll();
  }

  @Post()
  @RequirePermissions('products:create')
  create(
    @Body(new ZodValidationPipe(createCategorySchema)) body: CreateCategory,
  ) {
    return this.categories.create(body);
  }

  @Put(':id')
  @RequirePermissions('products:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema)) body: UpdateCategory,
  ) {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(id);
  }
}
