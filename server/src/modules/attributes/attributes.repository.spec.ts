import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { AttributesRepository } from './attributes.repository.js';

describe('AttributesRepository', () => {
  it('queries published and management attribute lists', async () => {
    const row = { id: 'attribute-1', slug: 'material', options: [] };
    const db = {
      attribute: {
        findMany: vi.fn().mockResolvedValue([row]),
        findFirst: vi.fn().mockResolvedValue(row),
        findUnique: vi.fn().mockResolvedValue(row),
      },
    } as unknown as PrismaService;
    const repository = new AttributesRepository(db);

    await expect(repository.listPublished()).resolves.toEqual([row]);
    await expect(repository.findPublishedBySlug('material')).resolves.toBe(row);
    await repository.listAll();
    await repository.findById('attribute-1');
    expect(db.attribute.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ where: { isPublished: true, deletedAt: null } }));
    expect(db.attribute.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'material', isPublished: true, deletedAt: null } }));
    expect(db.attribute.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { deletedAt: null } }));
    expect(db.attribute.findUnique).toHaveBeenCalledWith({ where: { id: 'attribute-1' } });
  });

  it('delegates attribute writes and soft deletes options with the attribute', async () => {
    const operations: unknown[] = [];
    const db = {
      attribute: {
        create: vi.fn().mockResolvedValue({ id: 'attribute-1' }),
        update: vi.fn().mockResolvedValue({ id: 'attribute-1' }),
      },
      attributeOption: {
        updateMany: vi.fn((query) => { operations.push(query); return Promise.resolve({ count: 1 }); }),
        update: vi.fn().mockResolvedValue({ id: 'option-1' }),
        findFirst: vi.fn().mockResolvedValue({ id: 'option-1' }),
        create: vi.fn().mockResolvedValue({ id: 'option-1' }),
      },
      $transaction: vi.fn((requests: Promise<unknown>[]) => Promise.all(requests)),
    } as unknown as PrismaService;
    const repository = new AttributesRepository(db);

    await repository.create({ name: 'Material', slug: 'material' } as never);
    await repository.update('attribute-1', { isPublished: false });
    await repository.softDelete('attribute-1');
    await repository.findOption('attribute-1', 'option-1');
    await repository.createOption('attribute-1', { name: 'Oak' } as never);
    await repository.updateOption('option-1', { isPublished: false });

    expect(db.attribute.create).toHaveBeenCalledOnce();
    expect(db.attribute.update).toHaveBeenCalledWith({ where: { id: 'attribute-1' }, data: { isPublished: false } });
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(operations).toHaveLength(1);
    expect(db.attributeOption.findFirst).toHaveBeenCalledWith({ where: { id: 'option-1', attributeId: 'attribute-1', deletedAt: null } });
    expect(db.attributeOption.create).toHaveBeenCalledWith({ data: { name: 'Oak', attribute: { connect: { id: 'attribute-1' } } } });
    expect(db.attributeOption.update).toHaveBeenCalledWith({ where: { id: 'option-1' }, data: { isPublished: false } });
  });
});
