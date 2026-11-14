import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsPublicController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list() {
    return this.products.listPublic();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.products.getPublicBySlug(slug);
  }
}
