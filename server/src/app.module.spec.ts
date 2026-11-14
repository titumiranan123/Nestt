import { MODULE_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { AppModule } from './app.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { BlogsModule } from './modules/blogs/blogs.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { SeoModule } from './modules/seo/seo.module.js';
import { AttributesModule } from './modules/attributes/attributes.module.js';
import { InvoicesModule } from './modules/invoices/invoices.module.js';

describe('AppModule', () => {
  it('registers the configured application and feature modules', () => {
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    ) as unknown[];
    expect(imports).toHaveLength(10);
    expect(imports).toContain(PaymentsModule);
    expect(imports).toContain(BlogsModule);
    expect(imports).toContain(CategoriesModule);
    expect(imports).toContain(OrdersModule);
    expect(imports).toContain(SeoModule);
    expect(imports).toContain(AttributesModule);
    expect(imports).toContain(InvoicesModule);
    expect(imports).not.toContain(AppModule);
  });
});
