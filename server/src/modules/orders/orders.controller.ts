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
  listOrdersSchema,
  quoteOrderSchema,
  requestReturnSchema,
  storefrontCheckoutSchema,
  submitCheckoutSchema,
} from './dto/order.schemas.js';
import type {
  CancelOrder,
  CreateOrder,
  ListOrders,
  QuoteOrder,
  RequestReturn,
  SubmitCheckout,
} from './dto/order.schemas.js';
import { OrdersService } from './orders.service.js';
import { SslCheckoutService } from './ssl-checkout.service.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService, private readonly ssl: SslCheckoutService) {}

  @Get('delivery-areas')
  deliveryAreas() {
    return this.orders.listDeliveryAreas();
  }

  @Post('quote')
  quote(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(quoteOrderSchema)) body: QuoteOrder,
  ) {
    return this.orders.quote(req.authUserId, body);
  }

  @Get('checkout/:checkoutId')
  recoverCheckout(@Req() req: AuthRequest, @Param('checkoutId', ParseUUIDPipe) checkoutId: string) {
    return this.orders.recoverCheckout(req.authUserId, checkoutId);
  }

  @Post()
  create(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(submitCheckoutSchema)) body: SubmitCheckout,
  ) {
    return this.orders.create(req.authUserId, body, req.ip ?? 'unknown');
  }

  @Post('otp')
  requestCheckoutCode(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(storefrontCheckoutSchema)) body: CreateOrder,
  ) {
    return this.orders.requestCheckoutCode(req.authUserId, body, req.ip ?? 'unknown');
  }

  @Post(':id/payment')
  startPayment(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.ssl.start(req.authUserId, id);
  }

  @Post(':id/payment/check')
  async checkPayment(@Req() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return { outcome: await this.ssl.check(id, req.authUserId) };
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
