import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RequirePermissions } from '../../common/decorators/permissions.decorator.js';
import { RoleEnum } from '@prisma/client';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { BlogAdminGuard } from './blog-admin.guard.js';
import {
  blogListQuerySchema,
  createBlogCategorySchema,
  createBlogSchema,
  createBlogTagSchema,
  footerSettingSchema,
  policySettingSchema,
  updateBlogCategorySchema,
  updateBlogSchema,
  updateBlogTagSchema,
} from './dto/blog.schemas.js';
import type {
  BlogListQuery,
  CreateBlog,
  CreateBlogCategory,
  CreateBlogTag,
  FooterSettingInput,
  PolicySettingInput,
  UpdateBlog,
  UpdateBlogCategory,
  UpdateBlogTag,
} from './dto/blog.schemas.js';
import { BlogsService } from './blogs.service.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, BlogAdminGuard, PermissionsGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SUPER_ADMIN, RoleEnum.MANAGER, RoleEnum.SUPPORT)
export class BlogsAdminController {
  constructor(private readonly blogs: BlogsService) {}

  @Get('blogs')
  @RequirePermissions('website:read')
  listBlogs(
    @Query(new ZodValidationPipe(blogListQuerySchema)) query: BlogListQuery,
  ) {
    return this.blogs.listAdmin(query);
  }
  @Get('blogs/:slug')
  @RequirePermissions('website:read')
  getBlog(@Param('slug') slug: string) {
    return this.blogs.getAdmin(slug);
  }
  @Post('blogs')
  @RequirePermissions('website:create')
  createBlog(
    @Body(new ZodValidationPipe(createBlogSchema)) input: CreateBlog,
    @Req() req: AuthRequest,
  ) {
    return this.blogs.create(input, req.authUserId);
  }
  @Put('blogs/:id')
  @RequirePermissions('website:update')
  updateBlog(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBlogSchema)) input: UpdateBlog,
  ) {
    return this.blogs.update(id, input);
  }
  @Delete('blogs/:id')
  @RequirePermissions('website:delete')
  removeBlog(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogs.remove(id);
  }

  @Get('blog-categories')
  @RequirePermissions('website:read')
  listCategories() {
    return this.blogs.listCategories();
  }
  @Post('blog-categories')
  @RequirePermissions('website:create')
  createCategory(
    @Body(new ZodValidationPipe(createBlogCategorySchema))
    input: CreateBlogCategory,
  ) {
    return this.blogs.createCategory(input);
  }
  @Put('blog-categories/:id')
  @RequirePermissions('website:update')
  updateCategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBlogCategorySchema))
    input: UpdateBlogCategory,
  ) {
    return this.blogs.updateCategory(id, input);
  }
  @Delete('blog-categories/:id')
  @RequirePermissions('website:delete')
  removeCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogs.removeCategory(id);
  }

  @Get('blog-tags')
  @RequirePermissions('website:read')
  listTags() {
    return this.blogs.listTags();
  }
  @Post('blog-tags')
  @RequirePermissions('website:create')
  createTag(
    @Body(new ZodValidationPipe(createBlogTagSchema)) input: CreateBlogTag,
  ) {
    return this.blogs.createTag(input);
  }
  @Put('blog-tags/:id')
  @RequirePermissions('website:update')
  updateTag(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateBlogTagSchema)) input: UpdateBlogTag,
  ) {
    return this.blogs.updateTag(id, input);
  }
  @Delete('blog-tags/:id')
  @RequirePermissions('website:delete')
  removeTag(@Param('id', ParseUUIDPipe) id: string) {
    return this.blogs.removeTag(id);
  }

  @Get('footer-settings')
  @RequirePermissions('website:read')
  getFooter() {
    return this.blogs.getFooter();
  }
  @Put('footer-settings')
  @RequirePermissions('website:update')
  saveFooter(
    @Body(new ZodValidationPipe(footerSettingSchema)) input: FooterSettingInput,
  ) {
    return this.blogs.saveFooter(input);
  }
  @Get('policy-settings')
  @RequirePermissions('website:read')
  getPolicies() {
    return this.blogs.getPolicies();
  }
  @Put('policy-settings')
  @RequirePermissions('website:update')
  savePolicy(
    @Body(new ZodValidationPipe(policySettingSchema)) input: PolicySettingInput,
  ) {
    return this.blogs.savePolicy(input);
  }
}
