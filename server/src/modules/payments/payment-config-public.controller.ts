import { Controller, Get } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service.js';

@Controller('payments')
export class PaymentConfigPublicController {
  constructor(private readonly paymentConfig: PaymentConfigService) {}

  @Get('config')
  async getPublicConfig() {
    const settings = await this.paymentConfig.getSettings();
    return { sslCommerzEnabled: settings.ssl?.status === true };
  }
}
