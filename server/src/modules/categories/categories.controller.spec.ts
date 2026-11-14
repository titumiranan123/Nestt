import { describe, expect, it, vi } from 'vitest';
import { CategoriesController } from './categories.controller.js';
import { CategoriesAdminController } from './categories-admin.controller.js';
import type { CategoriesService } from './categories.service.js';

describe('CategoriesController', () => {
  it('delegates public category queries', async () => {
    const categories = { listPublished: vi.fn().mockResolvedValue([]), getPublished: vi.fn().mockResolvedValue({ slug: 'chairs' }) };
    const controller = new CategoriesController(categories as unknown as CategoriesService);
    await expect(Promise.all([controller.list(), controller.get('chairs')])).resolves.toEqual([
      [],
      { slug: 'chairs' },
    ]);
    expect(categories.getPublished).toHaveBeenCalledWith('chairs');
  });
});

describe('CategoriesAdminController', () => {
  it('delegates protected management operations', async () => {
    const categories = {
      listAll: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
    };
    const controller = new CategoriesAdminController(categories as unknown as CategoriesService);
    await Promise.all([
      controller.list(),
      controller.create({ name: 'Chairs', slug: 'chairs', metaKeywords: [] }),
      controller.update('category-id', { name: 'Dining chairs' }),
      controller.remove('category-id'),
    ]);
    expect(categories.listAll).toHaveBeenCalledOnce();
    expect(categories.create).toHaveBeenCalledWith({ name: 'Chairs', slug: 'chairs', metaKeywords: [] });
    expect(categories.update).toHaveBeenCalledWith('category-id', { name: 'Dining chairs' });
    expect(categories.remove).toHaveBeenCalledWith('category-id');
  });
});
