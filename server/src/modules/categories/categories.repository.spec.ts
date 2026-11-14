import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { CategoriesRepository } from './categories.repository.js';

describe('CategoriesRepository', () => {
  it('lists public categories and resolves a published category by slug', async () => {
    const category = { id: 'cat-1', slug: 'chairs' };
    const db = {
      category: {
        findMany: vi.fn().mockResolvedValue([category]),
        findFirst: vi.fn().mockResolvedValue(category),
      },
    } as unknown as PrismaService;
    const repository = new CategoriesRepository(db);

    await expect(repository.listPublished()).resolves.toEqual([category]);
    await expect(repository.findPublishedBySlug('chairs')).resolves.toBe(category);
    expect(db.category.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }));
    expect(db.category.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { slug: 'chairs', isPublished: true, deletedAt: null },
    }));
  });

  it('lists active categories for management and delegates category writes', async () => {
    const db = {
      category: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue({ id: 'cat-1' }),
        create: vi.fn().mockResolvedValue({ id: 'cat-2' }),
        update: vi.fn().mockResolvedValue({ id: 'cat-1' }),
        count: vi.fn().mockResolvedValue(2),
      },
    } as unknown as PrismaService;
    const repository = new CategoriesRepository(db);

    await repository.listAll();
    await repository.findById('cat-1');
    await repository.create({ name: 'Chairs' } as never);
    await repository.update('cat-1', { isPublished: false });
    await expect(repository.countActiveChildren('cat-1')).resolves.toBe(2);

    expect(db.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deletedAt: null } }));
    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(db.category.create).toHaveBeenCalledOnce();
    expect(db.category.update).toHaveBeenCalledWith({ where: { id: 'cat-1' }, data: { isPublished: false } });
    expect(db.category.count).toHaveBeenCalledWith({ where: { parentId: 'cat-1', deletedAt: null } });
  });
});
