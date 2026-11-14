import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { SeoRepository } from './seo.repository.js';
import { SeoService } from './seo.service.js';

function setup() {
  const repository = {
    findMetaByPageName: vi.fn(),
    listMeta: vi.fn(),
    createMeta: vi.fn(),
    updateMeta: vi.fn(),
    deleteMeta: vi.fn(),
    getRobots: vi.fn(),
    saveRobots: vi.fn(),
    getSitemap: vi.fn(),
    saveSitemap: vi.fn(),
  };
  return {
    repository,
    service: new SeoService(repository as unknown as SeoRepository),
  };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test error', {
    code,
    clientVersion: 'test',
  });
}

describe('SeoService', () => {
  it('lists and creates SEO metadata', async () => {
    const { repository, service } = setup();
    repository.listMeta.mockResolvedValue([{ pageName: 'home' }]);
    repository.createMeta.mockResolvedValue({ pageName: 'about' });

    await expect(service.listMeta()).resolves.toEqual([{ pageName: 'home' }]);
    await expect(service.createMeta({ pageName: 'about', metaTitle: 'About', metaDescription: 'About us' })).resolves.toMatchObject({ pageName: 'about' });
  });

  it('returns metadata by page name', async () => {
    const { repository, service } = setup();
    const meta = { pageName: 'home', metaTitle: 'Home' };
    repository.findMetaByPageName.mockResolvedValue(meta);

    await expect(service.getMeta('home')).resolves.toBe(meta);
    expect(repository.findMetaByPageName).toHaveBeenCalledWith('home');
  });

  it('returns not found when metadata does not exist', async () => {
    const { service } = setup();
    await expect(service.getMeta('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps duplicate metadata creation to conflict', async () => {
    const { repository, service } = setup();
    repository.createMeta.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.createMeta({
        pageName: 'home',
        metaTitle: 'Home',
        metaDescription: 'Home page',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('passes through unexpected metadata creation errors', async () => {
    const { repository, service } = setup();
    const failure = new Error('database unavailable');
    repository.createMeta.mockRejectedValueOnce(failure);
    await expect(service.createMeta({ pageName: 'home', metaTitle: 'Home', metaDescription: 'Home page' })).rejects.toBe(failure);
  });

  it('maps missing metadata updates to not found', async () => {
    const { repository, service } = setup();
    repository.updateMeta.mockRejectedValue(prismaError('P2025'));

    await expect(service.updateMeta('missing', { metaTitle: 'Updated' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes through successful updates and maps unknown failures', async () => {
    const { repository, service } = setup();
    repository.updateMeta.mockResolvedValueOnce({ pageName: 'home', metaTitle: 'Updated' });
    await expect(service.updateMeta('home', { metaTitle: 'Updated' })).resolves.toMatchObject({ metaTitle: 'Updated' });
    const failure = new Error('database unavailable');
    repository.updateMeta.mockRejectedValueOnce(failure);
    await expect(service.updateMeta('home', { metaTitle: 'Updated' })).rejects.toBe(failure);
  });

  it('deletes metadata and maps missing or unexpected failures', async () => {
    const { repository, service } = setup();
    repository.deleteMeta.mockResolvedValueOnce({ pageName: 'home' });
    await expect(service.deleteMeta('home')).resolves.toEqual({ deleted: true });
    repository.deleteMeta.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.deleteMeta('missing')).rejects.toBeInstanceOf(NotFoundException);
    const failure = new Error('database unavailable');
    repository.deleteMeta.mockRejectedValueOnce(failure);
    await expect(service.deleteMeta('home')).rejects.toBe(failure);
  });

  it('returns empty public content when robots or sitemap has not been saved', async () => {
    const { repository, service } = setup();
    repository.getRobots.mockResolvedValue(null);
    repository.getSitemap.mockResolvedValue(null);

    await expect(service.getRobotsContent()).resolves.toBe('');
    await expect(service.getSitemapContent()).resolves.toBe('');
  });

  it('serves saved robots and sitemap content', async () => {
    const { repository, service } = setup();
    repository.getRobots.mockResolvedValue({ content: 'User-agent: *' });
    repository.getSitemap.mockResolvedValue({ content: '<urlset />' });
    await expect(service.getRobotsContent()).resolves.toBe('User-agent: *');
    await expect(service.getSitemapContent()).resolves.toBe('<urlset />');
  });

  it('stores robots and sitemap content with the actor id', async () => {
    const { repository, service } = setup();
    repository.saveRobots.mockResolvedValue({ content: 'User-agent: *' });
    repository.saveSitemap.mockResolvedValue({ content: '<urlset />' });

    await service.saveRobots('User-agent: *', 'user-1');
    await service.saveSitemap('<urlset />', 'user-1');

    expect(repository.saveRobots).toHaveBeenCalledWith('User-agent: *', 'user-1');
    expect(repository.saveSitemap).toHaveBeenCalledWith('<urlset />', 'user-1');
  });
});
