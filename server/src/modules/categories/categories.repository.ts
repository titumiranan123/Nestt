import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly db: PrismaService) {}

  listPublished() {
    return this.db.category.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, sortOrder: true, logo: true },
        },
      },
    });
  }

  findPublishedBySlug(slug: string) {
    return this.db.category.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, sortOrder: true, logo: true },
        },
      },
    });
  }

  listAll() {
    return this.db.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { children: true } },
      },
    });
  }

  findById(id: string) {
    return this.db.category.findUnique({ where: { id } });
  }

  create(data: Prisma.CategoryUncheckedCreateInput) {
    return this.db.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUncheckedUpdateInput) {
    return this.db.category.update({ where: { id }, data });
  }

  countActiveChildren(id: string) {
    return this.db.category.count({ where: { parentId: id, deletedAt: null } });
  }
}
