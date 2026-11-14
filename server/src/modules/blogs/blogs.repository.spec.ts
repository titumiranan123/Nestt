import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import type { BlogListQuery } from './dto/blog.schemas.js';
import { BlogsRepository } from './blogs.repository.js';

const listQuery = (overrides: Partial<BlogListQuery> = {}): BlogListQuery => ({
  page: 1,
  limit: 20,
  sort: 'newest',
  ...overrides,
});

function transactionDb(
  status: string = 'DRAFT',
  publishedAt: Date | null = null,
) {
  const tx = {
    blog: {
      create: vi.fn().mockResolvedValue({ id: 'blog-1' }),
      update: vi.fn().mockResolvedValue({ id: 'blog-1' }),
      findUniqueOrThrow: vi
        .fn()
        .mockResolvedValue({ id: 'blog-1', status, publishedAt }),
    },
    blogTagMap: { createMany: vi.fn(), deleteMany: vi.fn() },
    blogImage: { createMany: vi.fn(), deleteMany: vi.fn() },
  };
  const db = {
    ...tx,
    $transaction: vi.fn(async (work: (client: typeof tx) => unknown) =>
      work(tx),
    ),
  };
  return { db, tx };
}

describe('BlogsRepository', () => {
  it('lists published blogs with filters, pagination, and total count', async () => {
    const blogFindMany = vi.fn().mockResolvedValue([{ slug: 'hello' }]);
    const blogCount = vi.fn().mockResolvedValue(1);
    const repository = new BlogsRepository({
      blog: { findMany: blogFindMany, count: blogCount },
    } as unknown as PrismaService);
    const result = await repository.list(
      listQuery({
        page: 2,
        limit: 5,
        search: 'hello',
        category: 'guides',
        tag: 'tips',
        featured: true,
      }),
      true,
    );
    expect(result).toMatchObject({
      items: [{ slug: 'hello' }],
      total: 1,
      page: 2,
      limit: 5,
      pages: 1,
    });
    expect(blogFindMany.mock.calls[0][0]).toMatchObject({
      where: {
        status: 'PUBLISHED',
        isFeatured: true,
        category: { slug: 'guides' },
        tags: { some: { tag: { slug: 'tips' } } },
      },
      skip: 5,
      take: 5,
    });
  });

  it('lists all admin statuses in oldest order without optional filters', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const repository = new BlogsRepository({
      blog: { findMany, count },
    } as unknown as PrismaService);
    await expect(
      repository.list(listQuery({ status: 'DRAFT', sort: 'oldest' }), false),
    ).resolves.toMatchObject({ pages: 0 });
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { status: 'DRAFT' },
      orderBy: [{ publishedAt: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('finds blog details with visibility-dependent status conditions', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new BlogsRepository({
      blog: { findFirst },
    } as unknown as PrismaService);
    await repository.findBySlug('draft', true);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      slug: 'draft',
      status: 'PUBLISHED',
    });
    await repository.findBySlug('draft', false);
    expect(findFirst.mock.calls[1][0].where).toEqual({ slug: 'draft' });
  });

  it('creates a blog and atomically adds its tags and images', async () => {
    const { db, tx } = transactionDb();
    const repository = new BlogsRepository(db as unknown as PrismaService);
    const input = {
      title: 'Hello',
      slug: 'hello',
      content: 'Body',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      tagIds: ['tag-1'],
      images: [{ url: 'https://cdn.test/image.png', sortOrder: 0 }],
    };
    await repository.create(input, 'author-1');
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(tx.blog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        authorId: 'author-1',
        publishedAt: expect.any(Date),
      }),
    });
    expect(tx.blogTagMap.createMany).toHaveBeenCalledWith({
      data: [{ blogId: 'blog-1', tagId: 'tag-1' }],
    });
    expect(tx.blogImage.createMany).toHaveBeenCalledWith({
      data: [
        { blogId: 'blog-1', url: 'https://cdn.test/image.png', sortOrder: 0 },
      ],
    });
  });

  it('creates a draft without writing empty relation collections', async () => {
    const { db, tx } = transactionDb();
    const repository = new BlogsRepository(db as unknown as PrismaService);
    await repository.create(
      {
        title: 'Hello',
        slug: 'hello',
        content: 'Body',
        status: 'DRAFT',
        isFeatured: false,
        tagIds: [],
        images: [],
      },
      'author-1',
    );
    expect(tx.blog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ publishedAt: null }),
    });
    expect(tx.blogTagMap.createMany).not.toHaveBeenCalled();
    expect(tx.blogImage.createMany).not.toHaveBeenCalled();
  });

  it('updates blog data, resets provided relations, and preserves existing publish date', async () => {
    const publishedAt = new Date('2026-01-01T00:00:00.000Z');
    const { db, tx } = transactionDb('PUBLISHED', publishedAt);
    const repository = new BlogsRepository(db as unknown as PrismaService);
    await repository.update('blog-1', {
      title: 'Changed',
      status: 'PUBLISHED',
      tagIds: ['tag-2'],
      images: [],
    });
    expect(tx.blog.update).toHaveBeenCalledWith({
      where: { id: 'blog-1' },
      data: expect.objectContaining({ title: 'Changed', publishedAt }),
    });
    expect(tx.blogTagMap.deleteMany).toHaveBeenCalledWith({
      where: { blogId: 'blog-1' },
    });
    expect(tx.blogTagMap.createMany).toHaveBeenCalledWith({
      data: [{ blogId: 'blog-1', tagId: 'tag-2' }],
    });
    expect(tx.blogImage.deleteMany).toHaveBeenCalledWith({
      where: { blogId: 'blog-1' },
    });
    expect(tx.blogImage.createMany).not.toHaveBeenCalled();
  });

  it('sets first publish time, clears it when archiving, and leaves unspecified relations intact', async () => {
    const { db, tx } = transactionDb('DRAFT');
    const repository = new BlogsRepository(db as unknown as PrismaService);
    await repository.update('blog-1', { status: 'PUBLISHED' });
    expect(tx.blog.update.mock.calls[0][0].data.publishedAt).toBeInstanceOf(
      Date,
    );
    tx.blog.update.mockClear();
    await repository.update('blog-1', { status: 'ARCHIVED' });
    expect(tx.blog.update.mock.calls[0][0].data.publishedAt).toBeNull();
    expect(tx.blogTagMap.deleteMany).not.toHaveBeenCalled();
    expect(tx.blogImage.deleteMany).not.toHaveBeenCalled();
  });

  it('replaces populated images and clears explicitly emptied tags', async () => {
    const { db, tx } = transactionDb('ARCHIVED');
    const repository = new BlogsRepository(db as unknown as PrismaService);
    await repository.update('blog-1', {
      tagIds: [],
      images: [{ url: 'https://cdn.test/new.png', alt: 'New', sortOrder: 1 }],
    });
    expect(tx.blogTagMap.deleteMany).toHaveBeenCalledOnce();
    expect(tx.blogTagMap.createMany).not.toHaveBeenCalled();
    expect(tx.blogImage.createMany).toHaveBeenCalledWith({
      data: [
        {
          blogId: 'blog-1',
          url: 'https://cdn.test/new.png',
          alt: 'New',
          sortOrder: 1,
        },
      ],
    });
    expect(tx.blog.update.mock.calls[0][0].data.publishedAt).toBeUndefined();
  });

  it('delegates category, tag, footer, policy, and blog deletion operations to Prisma', async () => {
    const delegate = {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    };
    const db = {
      blog: { delete: delegate.delete, findUnique: delegate.findUnique },
      blogCategory: delegate,
      blogTag: delegate,
      footerSetting: delegate,
      storeSetting: delegate,
    } as unknown as PrismaService;
    const repository = new BlogsRepository(db);
    await repository.findById('blog');
    await repository.delete('blog');
    await repository.listCategories(true);
    await repository.listCategories();
    await repository.createCategory({ name: 'n', slug: 'n' });
    await repository.updateCategory('cat', { name: 'x' });
    await repository.deleteCategory('cat');
    await repository.listTags();
    await repository.listPublicTags();
    await repository.createTag({ name: 'n', slug: 'n' });
    await repository.updateTag('tag', { name: 'x' });
    await repository.deleteTag('tag');
    await repository.getFooter();
    await repository.saveFooter({ copyrightInfo: 'c', shortDescription: 'd' });
    await repository.listPolicies();
    await repository.savePolicy('policy_terms', 'terms');
    expect(delegate.findMany).toHaveBeenCalled();
    expect(delegate.create).toHaveBeenCalled();
    expect(delegate.update).toHaveBeenCalled();
    expect(delegate.delete).toHaveBeenCalled();
    expect(delegate.upsert).toHaveBeenCalledTimes(2);
  });
});
