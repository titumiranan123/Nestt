import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { AttributesRepository } from './attributes.repository.js';
import { AttributesService } from './attributes.service.js';

function setup() {
  const repository = {
    listPublished: vi.fn(),
    findPublishedBySlug: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    findOption: vi.fn(),
    createOption: vi.fn(),
    updateOption: vi.fn(),
  };
  return {
    repository,
    service: new AttributesService(repository as unknown as AttributesRepository),
  };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test error', {
    code,
    clientVersion: 'test',
  });
}

describe('AttributesService', () => {
  it('delegates published and management lists and successful writes', async () => {
    const { repository, service } = setup();
    repository.listPublished.mockResolvedValue([]);
    repository.listAll.mockResolvedValue([]);
    repository.create.mockResolvedValue({ id: 'attribute-1' });
    repository.findById.mockResolvedValue({ id: 'attribute-1', deletedAt: null });
    repository.update.mockResolvedValue({ id: 'attribute-1', name: 'Material' });

    await expect(service.listPublished()).resolves.toEqual([]);
    await expect(service.listAll()).resolves.toEqual([]);
    await expect(service.create({ name: 'Material', slug: 'material' })).resolves.toMatchObject({ id: 'attribute-1' });
    await expect(service.update('attribute-1', { name: 'Material' })).resolves.toMatchObject({ name: 'Material' });
  });

  it('returns published attribute details and hides missing slugs', async () => {
    const { repository, service } = setup();
    const attribute = { id: 'attribute-1', slug: 'material', options: [] };
    repository.findPublishedBySlug.mockResolvedValueOnce(attribute);

    await expect(service.getPublished('material')).resolves.toBe(attribute);
    await expect(service.getPublished('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates an option only for an active attribute', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValueOnce({ id: 'attribute-1', deletedAt: null });
    repository.createOption.mockResolvedValue({ id: 'option-1', name: 'Oak' });

    await expect(
      service.createOption('attribute-1', { name: 'Oak', value: 'oak' }),
    ).resolves.toMatchObject({ name: 'Oak' });
    expect(repository.createOption).toHaveBeenCalledWith('attribute-1', {
      name: 'Oak',
      value: 'oak',
    });
  });

  it('soft deletes an attribute and its options', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValue({ id: 'attribute-1', deletedAt: null });

    await expect(service.remove('attribute-1')).resolves.toEqual({ deleted: true });
    expect(repository.softDelete).toHaveBeenCalledWith('attribute-1');
  });

  it('rejects writes to a missing or deleted attribute', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValueOnce(null);
    await expect(service.update('missing', { name: 'Material' })).rejects.toBeInstanceOf(NotFoundException);
    repository.findById.mockResolvedValueOnce({ id: 'deleted', deletedAt: new Date() });
    await expect(service.remove('deleted')).rejects.toBeInstanceOf(NotFoundException);
    repository.findById.mockResolvedValueOnce(null);
    await expect(service.createOption('missing', { name: 'Oak' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes option updates to their parent attribute', async () => {
    const { repository, service } = setup();
    repository.findOption.mockResolvedValueOnce(null);

    await expect(
      service.updateOption('attribute-1', 'option-2', { name: 'Walnut' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.updateOption).not.toHaveBeenCalled();
  });

  it('updates an active option and maps missing Prisma records to not found', async () => {
    const { repository, service } = setup();
    repository.findOption.mockResolvedValueOnce({ id: 'option-1' });
    repository.updateOption.mockResolvedValueOnce({ id: 'option-1', name: 'Walnut' });
    await expect(service.updateOption('attribute-1', 'option-1', { name: 'Walnut' })).resolves.toMatchObject({ name: 'Walnut' });

    repository.findOption.mockResolvedValueOnce({ id: 'option-1' });
    repository.updateOption.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.updateOption('attribute-1', 'option-1', { name: 'Walnut' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps unknown Prisma write failures without changing them', async () => {
    const { repository, service } = setup();
    const failure = new Error('database unavailable');
    repository.create.mockRejectedValueOnce(failure);
    await expect(service.create({ name: 'Material', slug: 'material' })).rejects.toBe(failure);
  });

  it('maps duplicate and missing-record errors from attribute and option writes', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValue({ id: 'attribute-1', deletedAt: null });
    repository.update.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.update('attribute-1', { name: 'Material' })).rejects.toBeInstanceOf(ConflictException);
    repository.createOption.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.createOption('attribute-1', { name: 'Oak' })).rejects.toBeInstanceOf(NotFoundException);
    repository.findOption.mockResolvedValueOnce({ id: 'option-1' });
    repository.updateOption.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.updateOption('attribute-1', 'option-1', { name: 'Oak' })).rejects.toBeInstanceOf(ConflictException);
    repository.findOption.mockResolvedValueOnce(null);
    await expect(service.removeOption('attribute-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft deletes an option and unpublishes it', async () => {
    const { repository, service } = setup();
    repository.findOption.mockResolvedValueOnce({ id: 'option-1' });
    repository.updateOption.mockResolvedValue({ id: 'option-1' });

    await expect(
      service.removeOption('attribute-1', 'option-1'),
    ).resolves.toEqual({ deleted: true });
    expect(repository.updateOption).toHaveBeenCalledWith(
      'option-1',
      expect.objectContaining({ isPublished: false, deletedAt: expect.any(Date) }),
    );
  });

  it('maps duplicate attribute or option names to conflict', async () => {
    const { repository, service } = setup();
    repository.create.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.create({ name: 'Material', slug: 'material' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
