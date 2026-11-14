import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { BlogsRepository } from './blogs.repository.js';
import type { BlogListQuery } from './dto/blog.schemas.js';
import { BlogsService } from './blogs.service.js';

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('failure', {
    code,
    clientVersion: 'test',
  });

function setup() {
  const repository = {
    list: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    listCategories: vi.fn(),
    listTags: vi.fn(),
    listPublicTags: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
    getFooter: vi.fn(),
    saveFooter: vi.fn(),
    listPolicies: vi.fn(),
    savePolicy: vi.fn(),
  };
  return {
    repository,
    service: new BlogsService(repository as unknown as BlogsRepository),
  };
}

describe('BlogsService', () => {
  it('delegates list modes and only resolves matching public/admin details', async () => {
    const { repository, service } = setup();
    const query = { page: 1, limit: 20, sort: 'newest' } as BlogListQuery;
    await service.listPublic(query);
    await service.listAdmin(query);
    expect(repository.list).toHaveBeenNthCalledWith(1, query, true);
    expect(repository.list).toHaveBeenNthCalledWith(2, query, false);
    repository.findBySlug
      .mockResolvedValueOnce({ status: 'PUBLISHED' })
      .mockResolvedValueOnce({ status: 'DRAFT' })
      .mockResolvedValue(null);
    await expect(service.getPublic('published')).resolves.toMatchObject({
      status: 'PUBLISHED',
    });
    await expect(service.getAdmin('draft')).resolves.toMatchObject({
      status: 'DRAFT',
    });
    await expect(service.getPublic('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deduplicates tags and maps known blog write failures', async () => {
    const { repository, service } = setup();
    const input = {
      title: 'Title',
      slug: 'title',
      content: 'body',
      status: 'DRAFT' as const,
      isFeatured: false,
      tagIds: ['t1', 't1'],
      images: [],
    };
    repository.create.mockResolvedValue({ id: 'b1' });
    await service.create(input, 'author');
    expect(repository.create.mock.calls[0][0].tagIds).toEqual(['t1']);
    repository.create.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.create(input, 'author')).rejects.toBeInstanceOf(
      ConflictException,
    );
    repository.update.mockRejectedValueOnce(prismaError('P2025'));
    await expect(
      service.update('missing', { title: 'change' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    repository.update.mockRejectedValueOnce(prismaError('P2003'));
    await expect(
      service.update('b1', { categoryId: 'missing' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const unexpected = new Error('db down');
    repository.create.mockRejectedValueOnce(unexpected);
    await expect(service.create(input, 'author')).rejects.toBe(unexpected);
  });

  it('maps delete failures and delegates category, tag, footer, and policy operations', async () => {
    const { repository, service } = setup();
    repository.delete.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    repository.delete.mockResolvedValueOnce({ id: 'b1' });
    await expect(service.remove('b1')).resolves.toEqual({ deleted: true });
    repository.createCategory.mockResolvedValueOnce({ id: 'c1' });
    await service.createCategory({
      name: 'Guides',
      slug: 'guides',
      isVisible: true,
      displayOrder: 0,
    });
    await service.updateCategory('c1', { name: 'Manuals' });
    await service.removeCategory('c1');
    await service.createTag({ name: 'Tips', slug: 'tips' });
    await service.updateTag('t1', { name: 'Advice' });
    await service.removeTag('t1');
    await service.listPublicCategories();
    await service.listPublicTags();
    await service.listCategories();
    await service.listTags();
    const footer = { copyrightInfo: '©', shortDescription: 'Store' };
    await service.getFooter();
    await service.saveFooter(footer);
    await service.getPolicies();
    await service.savePolicy({ key: 'policy_terms', value: 'Terms' });
    expect(repository.listCategories).toHaveBeenNthCalledWith(1, true);
    expect(repository.listCategories).toHaveBeenNthCalledWith(2);
    expect(repository.savePolicy).toHaveBeenCalledWith('policy_terms', 'Terms');
  });

  it('maps duplicate, missing, and invalid-relation errors for category and tag writes', async () => {
    const { repository, service } = setup();
    const createCategory = {
      name: 'Guides',
      slug: 'guides',
      isVisible: true,
      displayOrder: 0,
    };
    const createTag = { name: 'Tips', slug: 'tips' };
    repository.createCategory.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.createCategory(createCategory)).rejects.toBeInstanceOf(
      ConflictException,
    );
    repository.updateCategory.mockRejectedValueOnce(prismaError('P2025'));
    await expect(
      service.updateCategory('missing', { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    repository.deleteCategory.mockRejectedValueOnce(prismaError('P2003'));
    await expect(service.removeCategory('c1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    repository.createTag.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.createTag(createTag)).rejects.toBeInstanceOf(
      ConflictException,
    );
    repository.updateTag.mockRejectedValueOnce(prismaError('P2025'));
    await expect(
      service.updateTag('missing', { name: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    repository.deleteTag.mockRejectedValueOnce(prismaError('P2003'));
    await expect(service.removeTag('t1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
