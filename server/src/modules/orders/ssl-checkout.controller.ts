import { Body, Controller, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { SslCheckoutService } from './ssl-checkout.service.js';

@Controller('payments/sslcommerz')
export class SslCheckoutController {
  constructor(private readonly ssl: SslCheckoutService) {}

  @Post(':kind')
  callback(
    @Param('kind') kind: string,
    @Query('order', ParseUUIDPipe) id: string,
    @Query('state') state: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.ssl.callback(id, kind, state ?? '', body ?? {});
  }
}
