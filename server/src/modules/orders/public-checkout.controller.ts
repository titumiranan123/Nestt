import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  publicCheckoutQuoteSchema,
  publicStorefrontCheckoutSchema,
  submitPublicCheckoutSchema,
} from './dto/order.schemas.js';
import type {
  PublicStorefrontCheckout,
  QuoteOrder,
  SubmitPublicCheckout,
} from './dto/order.schemas.js';
import { OrdersService } from './orders.service.js';

@Controller('public-checkout')
export class PublicCheckoutController {
  constructor(private readonly orders: OrdersService) {}

  @Get('delivery-areas')
  deliveryAreas() {
    return this.orders.listDeliveryAreas();
  }

  @Post('quote')
  quote(@Body(new ZodValidationPipe(publicCheckoutQuoteSchema)) body: QuoteOrder) {
    return this.orders.quotePublic(body);
  }

  @Post('otp')
  requestCode(
    @Body(new ZodValidationPipe(publicStorefrontCheckoutSchema)) body: PublicStorefrontCheckout,
    @Req() req: Request,
  ) {
    return this.orders.requestPublicCheckoutCode(body, req.ip ?? 'unknown');
  }

  @Post('complete')
  complete(
    @Body(new ZodValidationPipe(submitPublicCheckoutSchema)) body: SubmitPublicCheckout,
    @Req() req: Request,
  ) {
    return this.orders.completePublicCheckout(body, req.ip ?? 'unknown');
  }
}
