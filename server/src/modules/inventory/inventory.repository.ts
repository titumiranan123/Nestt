import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, type StockStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { inventoryVariantWhere, MAX_INVENTORY_QUANTITY } from './inventory.utils.js';

const variantIdentity = {
  sku: true,
  name: true,
  product: { select: { name: true } },
} satisfies Prisma.ProductVariantSelect;

const availability = {
  stockQty: true,
  lowStockAlertQty: true,
  stockStatus: true,
} as const;
const variantOrder: Prisma.ProductVariantOrderByWithRelationInput[] = [
  { product: { name: 'asc' } },
  { sortOrder: 'asc' },
  { sku: 'asc' },
];

@Injectable()
export class InventoryRepository {
  constructor(private readonly db: PrismaService) {}

  list() {
    return this.db.$transaction(
      [
        this.db.productVariant.findMany({
          where: inventoryVariantWhere,
          orderBy: variantOrder,
          select: {
            id: true,
            ...variantIdentity,
            ...availability,
            product: {
              select: {
                name: true,
                category: { select: { name: true } },
                brand: { select: { name: true } },
              },
            },
          },
        }),
        this.db.orderItem.groupBy({
          by: ['variantId'],
          where: {
            stockReserved: true,
            variant: inventoryVariantWhere,
            order: {
              status: {
                in: [
                  OrderStatus.PENDING,
                  OrderStatus.CONFIRMED,
                  OrderStatus.PROCESSING,
                ],
              },
            },
          },
          _sum: { quantity: true },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  adjustments() {
    return this.db.stockAdjustment.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        type: true,
        quantity: true,
        reason: true,
        createdAt: true,
        createdBy: true,
        variant: { select: variantIdentity },
      },
    });
  }

  adjustmentVariants() {
    return this.db.productVariant.findMany({
      where: inventoryVariantWhere,
      orderBy: variantOrder,
      select: { id: true, ...variantIdentity },
    });
  }

  actors(ids: string[]) {
    return this.db.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }

  transaction<T>(action: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.db.$transaction(action);
  }

  findAdjustment(tx: Prisma.TransactionClient, id: string) {
    return tx.stockAdjustment.findUnique({ where: { id } });
  }

  async claimAdjustment(
    tx: Prisma.TransactionClient,
    data: Prisma.StockAdjustmentCreateManyInput,
  ) {
    const { count } = await tx.stockAdjustment.createMany({
      data,
      skipDuplicates: true,
    });
    return count === 1;
  }

  findVariant(tx: Prisma.TransactionClient, id: string) {
    return tx.productVariant.findUnique({
      where: { ...inventoryVariantWhere, id },
      select: { id: true },
    });
  }

  adjustQuantity(tx: Prisma.TransactionClient, id: string, quantity: number) {
    return tx.productVariant.updateManyAndReturn({
      where: {
        ...inventoryVariantWhere,
        id,
        stockQty:
          quantity < 0
            ? { gte: -quantity }
            : { lte: MAX_INVENTORY_QUANTITY - quantity },
      },
      data: { stockQty: { increment: quantity } },
      select: availability,
    });
  }

  setThreshold(id: string, threshold: number) {
    return this.db.productVariant.update({
      where: { ...inventoryVariantWhere, id },
      data: { lowStockAlertQty: threshold },
      select: { id: true, lowStockAlertQty: true },
    });
  }

  setStockStatus(
    tx: Prisma.TransactionClient,
    id: string,
    stockStatus: StockStatus,
  ) {
    return tx.productVariant.update({
      where: { id },
      data: { stockStatus },
      select: { id: true },
    });
  }
}
