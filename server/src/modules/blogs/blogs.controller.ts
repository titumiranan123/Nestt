import { Controller, Get, Param, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { blogListQuerySchema } from './dto/blog.schemas.js';
import type { BlogListQuery } from './dto/blog.schemas.js';
import { BlogsService } from './blogs.service.js';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(blogListQuerySchema)) query: BlogListQuery,
  ) {
    return this.blogs.listPublic(query);
  }

  @Get('categories')
  categories() {
    return this.blogs.listPublicCategories();
  }

  @Get('tags')
  tags() {
    return this.blogs.listPublicTags();
  }

  @Get('policies')
  policies() {
    return this.blogs.getPolicies();
  }

  @Get('footer')
  footer() {
    return this.blogs.getFooter();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.blogs.getPublic(slug);
  }
}
