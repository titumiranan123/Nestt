import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  cancelOrderSchema,
  createOrderSchema,
  listOrdersSchema,
  requestReturnSchema,
} from './dto/order.schemas.js';
import type {
  CancelOrder,
  CreateOrder,
  ListOrders,
  RequestReturn,
} from './dto/order.schemas.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('delivery-areas')
  deliveryAreas() {
    return this.orders.listDeliveryAreas();
  }

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(createOrderSchema)) body: CreateOrder,
  ) {
    return this.orders.create(req.authUserId, body);
  }

  @Get()
  list(
    @Req() req: AuthRequest,
    @Query(new ZodValidationPipe(listOrdersSchema)) query: ListOrders,
  ) {
    return this.orders.listMine(req.authUserId, query);
  }

  @Get(':id')
  get(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getMine(req.authUserId, id);
  }

  @Post(':id/cancel')
  cancel(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(cancelOrderSchema)) body: CancelOrder,
  ) {
    return this.orders.cancelMine(req.authUserId, id, body);
  }

  @Post(':id/returns')
  requestReturn(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(requestReturnSchema)) body: RequestReturn,
  ) {
    return this.orders.requestReturn(req.authUserId, id, body);
  }
}
