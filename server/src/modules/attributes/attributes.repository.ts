import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class AttributesRepository {
  constructor(private readonly db: PrismaService) {}

  listPublished() {
    return this.db.attribute.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        options: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  findPublishedBySlug(slug: string) {
    return this.db.attribute.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: {
        options: {
          where: { isPublished: true, deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  listAll() {
    return this.db.attribute.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        options: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  findById(id: string) {
    return this.db.attribute.findUnique({ where: { id } });
  }

  findAdminById(id: string) {
    return this.db.attribute.findFirst({
      where: { id, deletedAt: null },
      include: {
        options: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  create(data: Prisma.AttributeCreateInput) {
    return this.db.attribute.create({ data });
  }

  update(id: string, data: Prisma.AttributeUpdateInput) {
    return this.db.attribute.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    const deletedAt = new Date();
    await this.db.$transaction([
      this.db.attributeOption.updateMany({
        where: { attributeId: id, deletedAt: null },
        data: { deletedAt, isPublished: false },
      }),
      this.db.attribute.update({
        where: { id },
        data: { deletedAt, isPublished: false },
      }),
    ]);
  }

  findOption(attributeId: string, optionId: string) {
    return this.db.attributeOption.findFirst({
      where: { id: optionId, attributeId, deletedAt: null },
    });
  }

  createOption(attributeId: string, data: Prisma.AttributeOptionCreateWithoutAttributeInput) {
    return this.db.attributeOption.create({
      data: { ...data, attribute: { connect: { id: attributeId } } },
    });
  }

  updateOption(id: string, data: Prisma.AttributeOptionUpdateInput) {
    return this.db.attributeOption.update({ where: { id }, data });
  }
}
