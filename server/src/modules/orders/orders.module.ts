import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../../providers/mail/mail.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { OrdersAdminController } from './orders-admin.controller.js';
import { OrdersController } from './orders.controller.js';
import { PublicCheckoutController } from './public-checkout.controller.js';
import { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';
import { CheckoutPhoneService } from './checkout-phone.service.js';
import { OrderStatusEmailService } from './order-status-email.service.js';
import { PaymentsModule } from '../payments/payments.module.js';
import { SslCheckoutService } from './ssl-checkout.service.js';
import { SslCheckoutController } from './ssl-checkout.controller.js';

@Module({
  imports: [AuthModule, MailModule, PaymentsModule],
  controllers: [OrdersController, PublicCheckoutController, OrdersAdminController, SslCheckoutController],
  providers: [
    OrdersRepository, OrdersService, CheckoutPhoneService, SslCheckoutService,
    OrderStatusEmailService, RolesGuard, PermissionsGuard, Reflector,
  ],
})
export class OrdersModule {}
