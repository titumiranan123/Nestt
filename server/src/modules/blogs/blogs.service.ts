import { Injectable, NotFoundException } from '@nestjs/common';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
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
import { BlogsRepository } from './blogs.repository.js';

@Injectable()
export class BlogsService {
  constructor(private readonly repository: BlogsRepository) {}

  listPublic(query: BlogListQuery) {
    return this.repository.list(query, true);
  }
  listAdmin(query: BlogListQuery) {
    return this.repository.list(query, false);
  }

  async getPublic(slug: string) {
    const blog = await this.repository.findBySlug(slug, true);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async getAdmin(slug: string) {
    const blog = await this.repository.findBySlug(slug, false);
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async create(input: CreateBlog, authorId: string) {
    try {
      return await this.repository.create(
        { ...input, tagIds: [...new Set(input.tagIds)] },
        authorId,
      );
    } catch (error) {
      this.rethrowWriteError(error, 'Blog');
    }
  }

  async update(id: string, input: UpdateBlog) {
    try {
      return await this.repository.update(id, {
        ...input,
        ...(input.tagIds ? { tagIds: [...new Set(input.tagIds)] } : {}),
      });
    } catch (error) {
      this.rethrowWriteError(error, 'Blog');
    }
  }

  async remove(id: string) {
    try {
      await this.repository.delete(id);
      return { deleted: true };
    } catch (error) {
      this.rethrowWriteError(error, 'Blog');
    }
  }

  listPublicCategories() {
    return this.repository.listCategories(true);
  }
  listCategories() {
    return this.repository.listCategories();
  }
  listTags() {
    return this.repository.listTags();
  }
  listPublicTags() {
    return this.repository.listPublicTags();
  }

  async createCategory(input: CreateBlogCategory) {
    try {
      return await this.repository.createCategory(input);
    } catch (error) {
      this.rethrowWriteError(error, 'Blog category');
    }
  }
  async updateCategory(id: string, input: UpdateBlogCategory) {
    try {
      return await this.repository.updateCategory(id, input);
    } catch (error) {
      this.rethrowWriteError(error, 'Blog category');
    }
  }
  async removeCategory(id: string) {
    try {
      await this.repository.deleteCategory(id);
      return { deleted: true };
    } catch (error) {
      this.rethrowWriteError(error, 'Blog category');
    }
  }

  async createTag(input: CreateBlogTag) {
    try {
      return await this.repository.createTag(input);
    } catch (error) {
      this.rethrowWriteError(error, 'Blog tag');
    }
  }
  async updateTag(id: string, input: UpdateBlogTag) {
    try {
      return await this.repository.updateTag(id, input);
    } catch (error) {
      this.rethrowWriteError(error, 'Blog tag');
    }
  }
  async removeTag(id: string) {
    try {
      await this.repository.deleteTag(id);
      return { deleted: true };
    } catch (error) {
      this.rethrowWriteError(error, 'Blog tag');
    }
  }

  getFooter() {
    return this.repository.getFooter();
  }
  saveFooter(input: FooterSettingInput) {
    return this.repository.saveFooter(input);
  }
  getPolicies() {
    return this.repository.listPolicies();
  }
  savePolicy(input: PolicySettingInput) {
    return this.repository.savePolicy(input.key, input.value);
  }

  private rethrowWriteError(error: unknown, resource: string): never {
    return throwMappedPrismaError(error, {
      unique: `${resource} slug already exists`,
      notFound: `${resource} not found`,
      foreignKey: 'One or more related records were not found',
    });
  }
}
