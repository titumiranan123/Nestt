import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.listPublished();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.categories.getPublished(slug);
  }
}
