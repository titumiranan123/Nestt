import { AdjustmentType, StockStatus, type Prisma } from '@prisma/client';

export const MAX_INVENTORY_QUANTITY = 1_000_000;

export const inventoryVariantWhere = {
  deletedAt: null,
  product: { deletedAt: null },
} satisfies Prisma.ProductVariantWhereInput;

export function resolveStockStatus(
  available: number,
  threshold: number,
  currentStatus: StockStatus,
): StockStatus {
  if (currentStatus === StockStatus.PREORDER) return StockStatus.PREORDER;
  if (available <= 0) return StockStatus.OUT_OF_STOCK;
  if (available <= threshold) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}

export function isAdjustmentQuantityAllowed(
  type: AdjustmentType,
  quantity: number,
) {
  switch (type) {
    case AdjustmentType.RESTOCK:
    case AdjustmentType.RETURN:
      return quantity > 0;
    case AdjustmentType.SALE:
    case AdjustmentType.DAMAGE:
    case AdjustmentType.TRANSFER:
      return quantity < 0;
    case AdjustmentType.CORRECTION:
      return quantity !== 0;
  }
}
