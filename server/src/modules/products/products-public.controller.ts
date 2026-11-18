import { Controller, Get, Param } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsPublicController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  list() {
    return this.products.listPublic();
  }

  @Get('collections/recommended')
  recommended() {
    return this.products.listRecommended();
  }

  @Get('collections/new-arrivals')
  newArrivals() {
    return this.products.listNewArrivals();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.products.getPublicBySlug(slug);
  }
}
