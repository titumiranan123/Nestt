import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';

function setup() {
  const categories = new Map<string, { id: string; parentId: string | null; deletedAt: Date | null; name?: string; isPublished?: boolean }>();
  const repository = {
    listPublished: vi.fn(),
    findPublishedBySlug: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(async (id: string) => categories.get(id) ?? null),
    create: vi.fn(),
    update: vi.fn(async (id: string, data: Record<string, unknown>) => {
      const category = categories.get(id);
      if (!category) throw new Error('missing category');
      Object.assign(category, data);
      return category;
    }),
    countActiveChildren: vi.fn(async () => 0),
  };
  return {
    categories,
    repository,
    service: new CategoriesService(repository as unknown as CategoriesRepository),
  };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test error', {
    code,
    clientVersion: 'test',
  });
}

describe('CategoriesService', () => {
  it('delegates list operations and updates an active category', async () => {
    const { categories, repository, service } = setup();
    repository.listPublished.mockResolvedValue([]);
    repository.listAll.mockResolvedValue([]);
    categories.set('cat-1', { id: 'cat-1', parentId: null, deletedAt: null });
    repository.update.mockResolvedValue({ id: 'cat-1', name: 'Updated', parentId: null, deletedAt: null });

    await expect(service.listPublished()).resolves.toEqual([]);
    await expect(service.listAll()).resolves.toEqual([]);
    await expect(service.update('cat-1', { name: 'Updated' })).resolves.toMatchObject({ name: 'Updated' });
  });

  it('returns published category details and hides missing slugs', async () => {
    const { repository, service } = setup();
    const category = { id: 'cat-1', slug: 'chairs' };
    repository.findPublishedBySlug.mockResolvedValueOnce(category);
    await expect(service.getPublished('chairs')).resolves.toBe(category);
    await expect(service.getPublished('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates a child only when its parent is active', async () => {
    const { categories, repository, service } = setup();
    categories.set('parent', { id: 'parent', parentId: null, deletedAt: null });
    repository.create.mockResolvedValue({ id: 'child', parentId: 'parent' });

    await service.create({ name: 'Dining chairs', slug: 'dining-chairs', parentId: 'parent', metaKeywords: [] });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dining chairs', parentId: 'parent' }),
    );
    await expect(
      service.create({ name: 'Other', slug: 'other', parentId: 'missing', metaKeywords: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects parent updates that would create a cycle', async () => {
    const { categories, service } = setup();
    categories.set('parent', { id: 'parent', parentId: null, deletedAt: null });
    categories.set('child', { id: 'child', parentId: 'parent', deletedAt: null });

    await expect(service.update('parent', { parentId: 'child' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects self-parenting and deleted or missing parents', async () => {
    const { categories, service } = setup();
    categories.set('cat-1', { id: 'cat-1', parentId: null, deletedAt: null });
    await expect(service.update('cat-1', { parentId: 'cat-1' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({ name: 'Child', slug: 'child', parentId: 'missing', metaKeywords: [] })).rejects.toBeInstanceOf(BadRequestException);
    categories.set('deleted', { id: 'deleted', parentId: null, deletedAt: new Date() });
    await expect(service.create({ name: 'Child', slug: 'child', parentId: 'deleted', metaKeywords: [] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.update('missing', { name: 'Updated' })).rejects.toBeInstanceOf(NotFoundException);
    categories.set('deleted-child', { id: 'deleted-child', parentId: null, deletedAt: new Date() });
    await expect(service.update('deleted-child', { name: 'Updated' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows a valid parent chain without introducing a cycle', async () => {
    const { categories, repository, service } = setup();
    categories.set('root', { id: 'root', parentId: null, deletedAt: null });
    categories.set('child', { id: 'child', parentId: null, deletedAt: null });
    repository.update.mockResolvedValue({ id: 'child', parentId: 'root', deletedAt: null });

    await expect(service.update('child', { parentId: 'root' })).resolves.toMatchObject({ parentId: 'root' });
  });

  it('rejects deletion while active children remain', async () => {
    const { categories, repository, service } = setup();
    categories.set('parent', { id: 'parent', parentId: null, deletedAt: null });
    repository.countActiveChildren.mockResolvedValueOnce(1);

    await expect(service.remove('parent')).rejects.toBeInstanceOf(ConflictException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('soft deletes a category and unpublishes it', async () => {
    const { categories, repository, service } = setup();
    categories.set('cat-1', { id: 'cat-1', parentId: null, deletedAt: null });

    await expect(service.remove('cat-1')).resolves.toEqual({ deleted: true });
    expect(repository.update).toHaveBeenCalledWith(
      'cat-1',
      expect.objectContaining({ isPublished: false, deletedAt: expect.any(Date) }),
    );
  });

  it('rejects deletion of missing or previously deleted categories', async () => {
    const { categories, service } = setup();
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    categories.set('deleted', { id: 'deleted', parentId: null, deletedAt: new Date() });
    await expect(service.remove('deleted')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps a duplicate slug to conflict', async () => {
    const { repository, service } = setup();
    repository.create.mockRejectedValue(prismaError('P2002'));

    await expect(service.create({ name: 'Chair', slug: 'chair', metaKeywords: [] })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('maps Prisma relation and update errors to clear client errors', async () => {
    const { categories, repository, service } = setup();
    repository.create.mockRejectedValueOnce(prismaError('P2003'));
    await expect(service.create({ name: 'Child', slug: 'child', metaKeywords: [] })).rejects.toBeInstanceOf(BadRequestException);
    categories.set('cat-1', { id: 'cat-1', parentId: null, deletedAt: null });
    repository.update.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.update('cat-1', { name: 'Updated' })).rejects.toBeInstanceOf(NotFoundException);
    const failure = new Error('database unavailable');
    repository.update.mockRejectedValueOnce(failure);
    await expect(service.update('cat-1', { name: 'Updated' })).rejects.toBe(failure);
  });
});
