import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { CartItemInput } from './dto/cart.schemas.js';

const cartInclude = {
  variant: {
    include: {
      product: { select: { id: true, name: true } },
      media: {
        orderBy: [{ isPrimary: 'desc' as const }, { displayOrder: 'asc' as const }],
        take: 1,
      },
      arAsset: { select: { modelUrl: true, dimensionsMm: true } },
    },
  },
} satisfies Prisma.CartItemInclude;

@Injectable()
export class CartService {
  constructor(private readonly db: PrismaService) {}

  get(userId: string) {
    return this.db.cartItem.findMany({ where: { userId }, include: cartInclude, orderBy: { createdAt: 'asc' } });
  }

  async add(userId: string, input: CartItemInput) {
    return this.db.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: {
          id: input.variantId,
          status: 'active',
          deletedAt: null,
          product: { is: { status: 'active', deletedAt: null } },
        },
        select: { id: true, stockQty: true },
      });
      if (!variant) throw new NotFoundException('Product variant not found');
      const current = await tx.cartItem.findUnique({ where: { userId_variantId: { userId, variantId: input.variantId } } });
      const nextQuantity = (current?.quantity ?? 0) + input.quantity;
      if (nextQuantity > Math.min(variant.stockQty, 99)) {
        throw new BadRequestException('Requested quantity exceeds available stock');
      }
      return tx.cartItem.upsert({
        where: { userId_variantId: { userId, variantId: input.variantId } },
        create: { userId, variantId: input.variantId, quantity: input.quantity },
        update: { quantity: nextQuantity },
        include: cartInclude,
      });
    });
  }

  async update(userId: string, variantId: string, quantity: number) {
    const variant = await this.db.productVariant.findFirst({
      where: {
        id: variantId,
        status: 'active',
        deletedAt: null,
        product: { is: { status: 'active', deletedAt: null } },
      },
      select: { stockQty: true },
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    if (quantity > Math.min(variant.stockQty, 99)) throw new BadRequestException('Requested quantity exceeds available stock');
    try {
      return await this.db.cartItem.update({ where: { userId_variantId: { userId, variantId } }, data: { quantity }, include: cartInclude });
    } catch { throw new NotFoundException('Cart item not found'); }
  }

  async remove(userId: string, variantId: string) {
    try {
      await this.db.cartItem.delete({ where: { userId_variantId: { userId, variantId } } });
      return { removed: true };
    } catch { throw new NotFoundException('Cart item not found'); }
  }
}
