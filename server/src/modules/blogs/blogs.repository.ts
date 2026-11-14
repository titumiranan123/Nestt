import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  paginationOffset,
  paginationResult,
} from '../../common/utils/pagination.js';
import type {
  BlogListQuery,
  CreateBlog,
  FooterSettingInput,
  UpdateBlog,
} from './dto/blog.schemas.js';

const BLOG_INCLUDE = {
  author: { select: { id: true, name: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
};
const FOOTER_ID = '00000000-0000-4000-8000-000000000002';

@Injectable()
export class BlogsRepository {
  constructor(private readonly db: PrismaService) {}

  list(query: BlogListQuery, publicOnly: boolean) {
    const where: Prisma.BlogWhereInput = {
      status: publicOnly ? 'PUBLISHED' : query.status,
      isFeatured: query.featured,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { excerpt: { contains: query.search, mode: 'insensitive' } },
              { content: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.tag ? { tags: { some: { tag: { slug: query.tag } } } } : {}),
    };
    const orderBy: Prisma.BlogOrderByWithRelationInput =
      query.sort === 'oldest'
        ? { publishedAt: 'asc' }
        : { publishedAt: 'desc' };
    return Promise.all([
      this.db.blog.findMany({
        where,
        orderBy: [orderBy, { createdAt: 'desc' }],
        skip: paginationOffset(query.page, query.limit),
        take: query.limit,
        include: BLOG_INCLUDE,
      }),
      this.db.blog.count({ where }),
    ]).then(([items, total]) =>
      paginationResult(items, total, query.page, query.limit, {
        pageSizeKey: 'limit',
        includePages: true,
      }),
    );
  }

  findBySlug(slug: string, publicOnly: boolean) {
    return this.db.blog.findFirst({
      where: { slug, ...(publicOnly ? { status: 'PUBLISHED' } : {}) },
      include: BLOG_INCLUDE,
    });
  }

  findById(id: string) {
    return this.db.blog.findUnique({ where: { id } });
  }

  async create(input: CreateBlog, authorId: string) {
    return this.db.$transaction(async (tx) => {
      const { tagIds, images, ...blogData } = input;
      const blog = await tx.blog.create({
        data: {
          ...blogData,
          authorId,
          publishedAt: blogData.status === 'PUBLISHED' ? new Date() : null,
        },
      });
      if (tagIds.length)
        await tx.blogTagMap.createMany({
          data: tagIds.map((tagId) => ({ blogId: blog.id, tagId })),
        });
      if (images.length)
        await tx.blogImage.createMany({
          data: images.map((image) => ({ ...image, blogId: blog.id })),
        });
      return tx.blog.findUniqueOrThrow({
        where: { id: blog.id },
        include: BLOG_INCLUDE,
      });
    });
  }

  async update(id: string, input: UpdateBlog) {
    return this.db.$transaction(async (tx) => {
      const current = await tx.blog.findUniqueOrThrow({
        where: { id },
        select: { status: true, publishedAt: true },
      });
      const { tagIds, images, ...blogData } = input;
      const data: Prisma.BlogUncheckedUpdateInput = { ...blogData };
      if (blogData.status === 'PUBLISHED' && current.status !== 'PUBLISHED')
        data.publishedAt = new Date();
      else if (blogData.status === 'PUBLISHED')
        data.publishedAt = current.publishedAt;
      else if (blogData.status) data.publishedAt = null;
      await tx.blog.update({ where: { id }, data });
      if (tagIds) {
        await tx.blogTagMap.deleteMany({ where: { blogId: id } });
        if (tagIds.length)
          await tx.blogTagMap.createMany({
            data: tagIds.map((tagId) => ({ blogId: id, tagId })),
          });
      }
      if (images) {
        await tx.blogImage.deleteMany({ where: { blogId: id } });
        if (images.length)
          await tx.blogImage.createMany({
            data: images.map((image) => ({ ...image, blogId: id })),
          });
      }
      return tx.blog.findUniqueOrThrow({
        where: { id },
        include: BLOG_INCLUDE,
      });
    });
  }

  delete(id: string) {
    return this.db.blog.delete({ where: { id } });
  }

  listCategories(publicOnly = false) {
    return this.db.blogCategory.findMany({
      where: publicOnly ? { isVisible: true } : undefined,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { blogs: true } } },
    });
  }
  createCategory(data: Prisma.BlogCategoryUncheckedCreateInput) {
    return this.db.blogCategory.create({ data });
  }
  updateCategory(id: string, data: Prisma.BlogCategoryUncheckedUpdateInput) {
    return this.db.blogCategory.update({ where: { id }, data });
  }
  deleteCategory(id: string) {
    return this.db.blogCategory.delete({ where: { id } });
  }

  listTags() {
    return this.db.blogTag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { blogs: true } } },
    });
  }
  listPublicTags() {
    return this.db.blogTag.findMany({
      where: { blogs: { some: { blog: { status: 'PUBLISHED' } } } },
      orderBy: { name: 'asc' },
    });
  }
  createTag(data: Prisma.BlogTagUncheckedCreateInput) {
    return this.db.blogTag.create({ data });
  }
  updateTag(id: string, data: Prisma.BlogTagUncheckedUpdateInput) {
    return this.db.blogTag.update({ where: { id }, data });
  }
  deleteTag(id: string) {
    return this.db.blogTag.delete({ where: { id } });
  }

  getFooter() {
    return this.db.footerSetting.findUnique({ where: { id: FOOTER_ID } });
  }
  saveFooter(data: FooterSettingInput) {
    return this.db.footerSetting.upsert({
      where: { id: FOOTER_ID },
      create: { id: FOOTER_ID, ...data },
      update: data,
    });
  }
  listPolicies() {
    return this.db.storeSetting.findMany({
      where: {
        key: {
          in: [
            'policy_refund',
            'policy_privacy',
            'policy_terms',
            'policy_shipping',
          ],
        },
      },
      orderBy: { key: 'asc' },
    });
  }
  savePolicy(key: string, value: string) {
    return this.db.storeSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
