import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { RoleEnum } from '@prisma/client';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  bulkThanaSchema,
  districtSchema,
  divisionSchema,
  saveZoneSchema,
  thanaSchema,
  updateThanaSchema,
  type BulkThanaInput,
  type DistrictInput,
  type DivisionInput,
  type ThanaInput,
  type UpdateThanaInput,
} from './dto/delivery-admin.schemas.js';
import type { DeliveryZoneConfigInput } from './dto/order.schemas.js';
import { DeliveryLocationService } from './delivery-location.service.js';
import { OrdersService } from './orders.service.js';

@Controller('admin/delivery')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class DeliveryAdminController {
  constructor(
    private readonly orders: OrdersService,
    private readonly locations: DeliveryLocationService,
  ) {}

  @Get('areas')
  @RequirePermissions('settings:read')
  listAreas() {
    return this.orders.listDeliveryAreas();
  }

  @Get('zone-configs')
  @RequirePermissions('settings:read')
  listZoneConfigs() {
    return this.orders.listDeliveryZoneConfigs();
  }

  @Put('zone-configs')
  @RequirePermissions('orders:update')
  saveZoneConfig(
    @Body(new ZodValidationPipe(saveZoneSchema)) body: DeliveryZoneConfigInput,
  ) {
    return this.orders.saveDeliveryZoneConfig(body);
  }

  @Post('divisions')
  @RequirePermissions('orders:update')
  createDivision(
    @Body(new ZodValidationPipe(divisionSchema)) body: DivisionInput,
  ) {
    return this.locations.createDivision(body);
  }

  @Patch('divisions/:id')
  @RequirePermissions('orders:update')
  updateDivision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(divisionSchema)) body: DivisionInput,
  ) {
    return this.locations.updateDivision(id, body);
  }

  @Delete('divisions/:id')
  @RequirePermissions('orders:update')
  deleteDivision(@Param('id', ParseUUIDPipe) id: string) {
    return this.locations.deleteDivision(id);
  }

  @Post('districts')
  @RequirePermissions('orders:update')
  createDistrict(
    @Body(new ZodValidationPipe(districtSchema)) body: DistrictInput,
  ) {
    return this.locations.createDistrict(body);
  }

  @Patch('districts/:id')
  @RequirePermissions('orders:update')
  updateDistrict(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(districtSchema)) body: DistrictInput,
  ) {
    return this.locations.updateDistrict(id, body);
  }

  @Delete('districts/:id')
  @RequirePermissions('orders:update')
  deleteDistrict(@Param('id', ParseUUIDPipe) id: string) {
    return this.locations.deleteDistrict(id);
  }

  @Post('thanas')
  @RequirePermissions('orders:update')
  createThana(@Body(new ZodValidationPipe(thanaSchema)) body: ThanaInput) {
    return this.locations.createThana(body);
  }

  @Patch('thanas/bulk')
  @RequirePermissions('orders:update')
  bulkUpdateThanas(
    @Body(new ZodValidationPipe(bulkThanaSchema)) body: BulkThanaInput,
  ) {
    return this.locations.bulkUpdateThanas(body);
  }

  @Patch('thanas/:id')
  @RequirePermissions('orders:update')
  updateThana(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateThanaSchema)) body: UpdateThanaInput,
  ) {
    return this.locations.updateThana(id, body);
  }

  @Delete('thanas/:id')
  @RequirePermissions('orders:update')
  deleteThana(@Param('id', ParseUUIDPipe) id: string) {
    return this.locations.deleteThana(id);
  }
}
