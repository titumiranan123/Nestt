import { describe, expect, it, vi } from 'vitest';
import { SeoAdminController } from './seo-admin.controller.js';
import { SeoController } from './seo.controller.js';
import type { SeoService } from './seo.service.js';

describe('SeoController', () => {
  it('delegates public metadata, robots and sitemap reads', async () => {
    const seo = { getMeta: vi.fn(), getRobotsContent: vi.fn(), getSitemapContent: vi.fn() };
    const controller = new SeoController(seo as unknown as SeoService);
    await Promise.all([
      controller.getMeta('home'),
      controller.getRobots(),
      controller.getSitemap(),
    ]);
    expect(seo.getMeta).toHaveBeenCalledWith('home');
    expect(seo.getRobotsContent).toHaveBeenCalledOnce();
    expect(seo.getSitemapContent).toHaveBeenCalledOnce();
  });
});

describe('SeoAdminController', () => {
  it('delegates SEO metadata and site content management', async () => {
    const seo = {
      listMeta: vi.fn(), createMeta: vi.fn(), updateMeta: vi.fn(), deleteMeta: vi.fn(),
      saveRobots: vi.fn(), saveSitemap: vi.fn(),
    };
    const controller = new SeoAdminController(seo as unknown as SeoService);
    const request = { authUserId: 'user-1' } as never;
    await Promise.all([
      controller.listMeta(),
      controller.createMeta({ pageName: 'home', metaTitle: 'Home', metaDescription: 'Home page' }),
      controller.updateMeta('home', { metaTitle: 'Updated' }),
      controller.deleteMeta('home'),
      controller.saveRobots({ content: 'User-agent: *' }, request),
      controller.saveSitemap({ content: '<urlset />' }, request),
    ]);
    expect(seo.listMeta).toHaveBeenCalledOnce();
    expect(seo.createMeta).toHaveBeenCalledWith({ pageName: 'home', metaTitle: 'Home', metaDescription: 'Home page' });
    expect(seo.updateMeta).toHaveBeenCalledWith('home', { metaTitle: 'Updated' });
    expect(seo.deleteMeta).toHaveBeenCalledWith('home');
    expect(seo.saveRobots).toHaveBeenCalledWith('User-agent: *', 'user-1');
    expect(seo.saveSitemap).toHaveBeenCalledWith('<urlset />', 'user-1');
  });
});
