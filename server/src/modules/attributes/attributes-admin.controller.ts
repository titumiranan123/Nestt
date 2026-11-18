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
  createAttributeOptionSchema,
  createAttributeSchema,
  updateAttributeOptionSchema,
  updateAttributeSchema,
} from './dto/attribute.schemas.js';
import type {
  CreateAttribute,
  CreateAttributeOption,
  UpdateAttribute,
  UpdateAttributeOption,
} from './dto/attribute.schemas.js';
import { AttributesService } from './attributes.service.js';

@Controller('admin/attributes')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class AttributesAdminController {
  constructor(private readonly attributes: AttributesService) {}

  @Get()
  @RequirePermissions('products:read')
  list() {
    return this.attributes.listAll();
  }

  @Get(':id')
  @RequirePermissions('products:read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributes.getAdminById(id);
  }

  @Post()
  @RequirePermissions('products:create')
  create(
    @Body(new ZodValidationPipe(createAttributeSchema)) body: CreateAttribute,
  ) {
    return this.attributes.create(body);
  }

  @Put(':id')
  @RequirePermissions('products:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAttributeSchema)) body: UpdateAttribute,
  ) {
    return this.attributes.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attributes.remove(id);
  }

  @Post(':attributeId/options')
  @RequirePermissions('products:create')
  createOption(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Body(new ZodValidationPipe(createAttributeOptionSchema))
    body: CreateAttributeOption,
  ) {
    return this.attributes.createOption(attributeId, body);
  }

  @Put(':attributeId/options/:optionId')
  @RequirePermissions('products:update')
  updateOption(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('optionId', ParseUUIDPipe) optionId: string,
    @Body(new ZodValidationPipe(updateAttributeOptionSchema))
    body: UpdateAttributeOption,
  ) {
    return this.attributes.updateOption(attributeId, optionId, body);
  }

  @Delete(':attributeId/options/:optionId')
  @RequirePermissions('products:delete')
  removeOption(
    @Param('attributeId', ParseUUIDPipe) attributeId: string,
    @Param('optionId', ParseUUIDPipe) optionId: string,
  ) {
    return this.attributes.removeOption(attributeId, optionId);
  }
}
