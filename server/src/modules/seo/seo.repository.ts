import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

const SITEMAP_ID = '00000000-0000-4000-8000-000000000001';

@Injectable()
export class SeoRepository {
  constructor(private readonly db: PrismaService) {}

  findMetaByPageName(pageName: string) {
    return this.db.seoMeta.findUnique({ where: { pageName } });
  }

  listMeta() {
    return this.db.seoMeta.findMany({ orderBy: { pageName: 'asc' } });
  }

  createMeta(data: Prisma.SeoMetaCreateInput) {
    return this.db.seoMeta.create({ data });
  }

  updateMeta(pageName: string, data: Prisma.SeoMetaUpdateInput) {
    return this.db.seoMeta.update({ where: { pageName }, data });
  }

  deleteMeta(pageName: string) {
    return this.db.seoMeta.delete({ where: { pageName } });
  }

  getRobots() {
    return this.db.siteRobots.findUnique({ where: { id: 1 } });
  }

  saveRobots(content: string, updatedBy: string) {
    return this.db.siteRobots.upsert({
      where: { id: 1 },
      create: { content, updatedBy },
      update: { content, updatedBy },
    });
  }

  getSitemap() {
    return this.db.siteSitemap.findUnique({ where: { id: SITEMAP_ID } });
  }

  saveSitemap(content: string, updatedBy: string) {
    return this.db.siteSitemap.upsert({
      where: { id: SITEMAP_ID },
      create: { id: SITEMAP_ID, content, updatedBy },
      update: { content, updatedBy },
    });
  }
}
