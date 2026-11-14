import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateSeoMeta, UpdateSeoMeta } from './dto/seo.schemas.js';
import { SeoRepository } from './seo.repository.js';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';

@Injectable()
export class SeoService {
  constructor(private readonly repository: SeoRepository) {}

  async getMeta(pageName: string) {
    const meta = await this.repository.findMetaByPageName(pageName);
    if (!meta) throw new NotFoundException('SEO metadata not found');
    return meta;
  }

  listMeta() {
    return this.repository.listMeta();
  }

  async createMeta(input: CreateSeoMeta) {
    try {
      return await this.repository.createMeta(input);
    } catch (error) {
      throwMappedPrismaError(error, {
        unique: 'SEO metadata already exists for this page',
      });
    }
  }

  async updateMeta(pageName: string, input: UpdateSeoMeta) {
    try {
      return await this.repository.updateMeta(pageName, input);
    } catch (error) {
      throwMappedPrismaError(error, { notFound: 'SEO metadata not found' });
    }
  }

  async deleteMeta(pageName: string) {
    try {
      await this.repository.deleteMeta(pageName);
      return { deleted: true };
    } catch (error) {
      throwMappedPrismaError(error, { notFound: 'SEO metadata not found' });
    }
  }

  async getRobotsContent() {
    return (await this.repository.getRobots())?.content ?? '';
  }

  async getRobotsRecord() {
    const record = await this.repository.getRobots();
    return {
      content: record?.content ?? '',
      updatedAt: record?.updatedAt ?? null,
    };
  }

  saveRobots(content: string, updatedBy: string) {
    return this.repository.saveRobots(content, updatedBy);
  }

  async getSitemapContent() {
    return (await this.repository.getSitemap())?.content ?? '';
  }

  async getSitemapRecord() {
    const record = await this.repository.getSitemap();
    return {
      content: record?.content ?? '',
      updatedAt: record?.updatedAt ?? null,
    };
  }

  saveSitemap(content: string, updatedBy: string) {
    return this.repository.saveSitemap(content, updatedBy);
  }
}
