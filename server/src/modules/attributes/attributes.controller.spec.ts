import { describe, expect, it, vi } from 'vitest';
import { AttributesController } from './attributes.controller.js';
import { AttributesAdminController } from './attributes-admin.controller.js';
import type { AttributesService } from './attributes.service.js';

describe('AttributesController', () => {
  it('delegates public attribute queries', async () => {
    const attributes = { listPublished: vi.fn().mockResolvedValue([]), getPublished: vi.fn().mockResolvedValue({ slug: 'material' }) };
    const controller = new AttributesController(attributes as unknown as AttributesService);
    await expect(Promise.all([controller.list(), controller.get('material')])).resolves.toEqual([
      [],
      { slug: 'material' },
    ]);
    expect(attributes.getPublished).toHaveBeenCalledWith('material');
  });
});

describe('AttributesAdminController', () => {
  it('delegates attribute and nested option management', async () => {
    const attributes = {
      listAll: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
      createOption: vi.fn(), updateOption: vi.fn(), removeOption: vi.fn(),
    };
    const controller = new AttributesAdminController(attributes as unknown as AttributesService);
    await Promise.all([
      controller.list(),
      controller.create({ name: 'Material', slug: 'material' }),
      controller.update('attribute-id', { showInFilter: true }),
      controller.remove('attribute-id'),
      controller.createOption('attribute-id', { name: 'Oak' }),
      controller.updateOption('attribute-id', 'option-id', { value: 'oak' }),
      controller.removeOption('attribute-id', 'option-id'),
    ]);
    expect(attributes.listAll).toHaveBeenCalledOnce();
    expect(attributes.create).toHaveBeenCalledWith({ name: 'Material', slug: 'material' });
    expect(attributes.update).toHaveBeenCalledWith('attribute-id', { showInFilter: true });
    expect(attributes.remove).toHaveBeenCalledWith('attribute-id');
    expect(attributes.createOption).toHaveBeenCalledWith('attribute-id', { name: 'Oak' });
    expect(attributes.updateOption).toHaveBeenCalledWith('attribute-id', 'option-id', { value: 'oak' });
    expect(attributes.removeOption).toHaveBeenCalledWith('attribute-id', 'option-id');
  });
});
