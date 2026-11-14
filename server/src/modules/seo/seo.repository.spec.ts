import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { SeoRepository } from './seo.repository.js';

describe('SeoRepository', () => {
  it('queries, creates, updates, and deletes metadata by page name', async () => {
    const db = {
      seoMeta: {
        findUnique: vi.fn().mockResolvedValue({ pageName: 'home' }),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: 'meta-1' }),
        update: vi.fn().mockResolvedValue({ id: 'meta-1' }),
        delete: vi.fn().mockResolvedValue({ id: 'meta-1' }),
      },
    } as unknown as PrismaService;
    const repository = new SeoRepository(db);

    await expect(repository.findMetaByPageName('home')).resolves.toMatchObject({ pageName: 'home' });
    await repository.listMeta();
    await repository.createMeta({ pageName: 'home' } as never);
    await repository.updateMeta('home', { metaTitle: 'Updated' });
    await repository.deleteMeta('home');

    expect(db.seoMeta.findMany).toHaveBeenCalledWith({ orderBy: { pageName: 'asc' } });
    expect(db.seoMeta.create).toHaveBeenCalledOnce();
    expect(db.seoMeta.update).toHaveBeenCalledWith({ where: { pageName: 'home' }, data: { metaTitle: 'Updated' } });
    expect(db.seoMeta.delete).toHaveBeenCalledWith({ where: { pageName: 'home' } });
  });

  it('upserts robots content in the singleton row', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 1, content: 'User-agent: *' });
    const db = { siteRobots: { findUnique: vi.fn().mockResolvedValue(null), upsert } } as unknown as PrismaService;
    const repository = new SeoRepository(db);

    await repository.getRobots();
    await repository.saveRobots('User-agent: *', 'user-1');
    expect(db.siteRobots.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { content: 'User-agent: *', updatedBy: 'user-1' },
      update: { content: 'User-agent: *', updatedBy: 'user-1' },
    });
  });

  it('upserts sitemap content under its stable singleton id', async () => {
    const upsert = vi.fn().mockResolvedValue({ content: '<urlset />' });
    const db = { siteSitemap: { findUnique: vi.fn().mockResolvedValue(null), upsert } } as unknown as PrismaService;
    const repository = new SeoRepository(db);

    await repository.getSitemap();
    await repository.saveSitemap('<urlset />', 'user-1');
    expect(db.siteSitemap.findUnique).toHaveBeenCalledWith({
      where: { id: '00000000-0000-4000-8000-000000000001' },
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { id: '00000000-0000-4000-8000-000000000001' },
      create: { id: '00000000-0000-4000-8000-000000000001', content: '<urlset />', updatedBy: 'user-1' },
      update: { content: '<urlset />', updatedBy: 'user-1' },
    });
  });
});
