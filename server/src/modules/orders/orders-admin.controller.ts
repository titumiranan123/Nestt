import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { RoleEnum } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import {
  createOrderRemarkSchema,
  listOrdersSchema,
  deliveryAreaSchema,
  deliveryZoneConfigSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  updateReturnStatusSchema,
} from './dto/order.schemas.js';
import type {
  CreateOrderRemark,
  ListOrders,
  DeliveryAreaInput,
  DeliveryZoneConfigInput,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateReturnStatus,
} from './dto/order.schemas.js';
import { OrdersService } from './orders.service.js';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class OrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermissions('orders:read')
  list(@Query(new ZodValidationPipe(listOrdersSchema)) query: ListOrders) {
    return this.orders.listAll(query);
  }

  @Get('delivery-areas')
  @RequirePermissions('orders:read')
  listDeliveryAreas() {
    return this.orders.listDeliveryAreas();
  }

  @Put('delivery-areas')
  @RequirePermissions('orders:update')
  saveDeliveryArea(
    @Body(new ZodValidationPipe(deliveryAreaSchema)) body: DeliveryAreaInput,
  ) {
    return this.orders.saveDeliveryArea(body);
  }

  @Get('delivery-zones')
  @RequirePermissions('orders:read')
  listDeliveryZoneConfigs() {
    return this.orders.listDeliveryZoneConfigs();
  }

  @Put('delivery-zones')
  @RequirePermissions('orders:update')
  saveDeliveryZoneConfig(
    @Body(new ZodValidationPipe(deliveryZoneConfigSchema))
    body: DeliveryZoneConfigInput,
  ) {
    return this.orders.saveDeliveryZoneConfig(body);
  }

  @Get(':id')
  @RequirePermissions('orders:read')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getById(id);
  }

  @Patch(':id/status')
  @RequirePermissions('orders:update')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(updateOrderStatusSchema))
    body: UpdateOrderStatus,
  ) {
    return this.orders.updateStatus(id, req.authUserId, body);
  }

  @Patch(':id/payment')
  @RequirePermissions('orders:update')
  updatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(updatePaymentStatusSchema))
    body: UpdatePaymentStatus,
  ) {
    return this.orders.updatePaymentStatus(id, req.authUserId, body);
  }

  @Post(':id/remarks')
  @RequirePermissions('orders:update')
  addRemark(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(createOrderRemarkSchema))
    body: CreateOrderRemark,
  ) {
    return this.orders.addRemark(id, req.authUserId, body);
  }

  @Patch('returns/:returnId')
  @RequirePermissions('orders:update')
  updateReturn(
    @Param('returnId', ParseUUIDPipe) returnId: string,
    @Body(new ZodValidationPipe(updateReturnStatusSchema))
    body: UpdateReturnStatus,
  ) {
    return this.orders.updateReturnStatus(returnId, body);
  }
}
