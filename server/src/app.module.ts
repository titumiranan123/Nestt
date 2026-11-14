import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { SeoModule } from './modules/seo/seo.module.js';
import { AttributesModule } from './modules/attributes/attributes.module.js';
import { InvoicesModule } from './modules/invoices/invoices.module.js';
import { BlogsModule } from './modules/blogs/blogs.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { ARModule } from './modules/ar/ar.module.js';
import { AddressesModule } from './modules/addresses/addresses.module.js';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    CategoriesModule,
    OrdersModule,
    PaymentsModule,
    SeoModule,
    AttributesModule,
    InvoicesModule,
    BlogsModule,
    UsersModule,
    ProductsModule,
    CartModule,
    ARModule,
    AddressesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
