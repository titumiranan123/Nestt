import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service.js';
import type { SaveARDesign, UpdateARDesign } from './dto/ar-design.schemas.js';

const editTokenHash = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class ARService {
  constructor(private readonly db: PrismaService) {}

  async catalog() {
    const rows = await this.db.productVariant.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        product: {
          is: {
            status: 'active',
            deletedAt: null,
            category: { isPublished: true, deletedAt: null },
          },
        },
        arAsset: { is: { isPublished: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true, sku: true, name: true, price: true, stockQty: true,
        media: {
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
          take: 1,
          select: { url: true },
        },
        product: { select: { id: true, name: true, category: { select: { name: true, slug: true } } } },
        arAsset: { select: { modelUrl: true, dimensionsMm: true, placement: true } },
      },
    });
    return rows.map((row) => ({
      variantId: row.id,
      slug: row.id,
      sku: row.sku,
      name: row.product.name,
      variantName: row.name,
      category: row.product.category.name,
      categorySlug: row.product.category.slug,
      price: row.price.toString(),
      inStock: row.stockQty > 0,
      stockQuantity: row.stockQty,
      image: row.media[0]?.url ?? null,
      modelUrl: row.arAsset!.modelUrl,
      dimensionsMm: row.arAsset!.dimensionsMm,
      placement: row.arAsset!.placement,
    }));
  }

  async create(input: SaveARDesign, userId?: string) {
    const shareId = randomBytes(24).toString('base64url');
    const editToken = randomBytes(32).toString('base64url');
    const design = await this.db.aRDesign.create({
      data: {
        userId: userId ?? null,
        shareId,
        title: input.title,
        room: input.room as Prisma.InputJsonValue,
        editTokenHash: editTokenHash(editToken),
      },
      select: { id: true, shareId: true, title: true, room: true, createdAt: true, updatedAt: true },
    });
    return { ...design, editToken };
  }

  listMine(userId: string) {
    return this.db.aRDesign.findMany({
      where: { userId }, orderBy: { updatedAt: 'desc' },
      select: { id: true, shareId: true, title: true, room: true, shareEnabled: true, createdAt: true, updatedAt: true },
    });
  }

  async getShared(shareId: string) {
    const design = await this.db.aRDesign.findFirst({
      where: { shareId, shareEnabled: true },
      select: { shareId: true, title: true, room: true, screenshotUrl: true, updatedAt: true },
    });
    if (!design) throw new NotFoundException('Shared room design not found');
    return design;
  }

  async update(id: string, input: UpdateARDesign, userId?: string, editToken?: string) {
    const design = await this.db.aRDesign.findUnique({ where: { id }, select: { userId: true, editTokenHash: true } });
    if (!design) throw new NotFoundException('Room design not found');
    const ownsAccountDesign = !!userId && design.userId === userId;
    const ownsGuestDesign = !!editToken && editTokenHash(editToken) === design.editTokenHash;
    if (!ownsAccountDesign && !ownsGuestDesign) throw new ForbiddenException('You cannot edit this room design');
    return this.db.aRDesign.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.room !== undefined ? { room: input.room as Prisma.InputJsonValue } : {}),
        ...(input.shareEnabled !== undefined ? { shareEnabled: input.shareEnabled } : {}),
      },
      select: { id: true, shareId: true, title: true, room: true, shareEnabled: true, updatedAt: true },
    });
  }

  async remove(id: string, userId?: string, editToken?: string) {
    const design = await this.db.aRDesign.findUnique({ where: { id }, select: { userId: true, editTokenHash: true } });
    if (!design) throw new NotFoundException('Room design not found');
    const ownsAccountDesign = !!userId && design.userId === userId;
    const ownsGuestDesign = !!editToken && editTokenHash(editToken) === design.editTokenHash;
    if (!ownsAccountDesign && !ownsGuestDesign) throw new ForbiddenException('You cannot delete this room design');
    await this.db.aRDesign.delete({ where: { id } });
    return { deleted: true };
  }
}
