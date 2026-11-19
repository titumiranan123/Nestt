import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { StockAdjustment } from '@prisma/client';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';
import { InventoryRepository } from './inventory.repository.js';
import type { StockAdjustmentInput } from './inventory.schemas.js';
import { resolveStockStatus } from './inventory.utils.js';

const variantNotFound = 'Product variant not found.';

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  async list() {
    const [variants, reservations] = await this.repository.list();
    const reservedByVariant = new Map(
      reservations.map((row) => [row.variantId, row._sum.quantity ?? 0]),
    );

    return variants.map((variant) => {
      const reserved = reservedByVariant.get(variant.id) ?? 0;
      return {
        id: variant.id,
        sku: variant.sku,
        product: variant.product.name,
        variant: variant.name,
        category: variant.product.category.name,
        brand: variant.product.brand?.name ?? null,
        stock: variant.stockQty + reserved,
        available: variant.stockQty,
        reserved,
        threshold: variant.lowStockAlertQty,
        status: resolveStockStatus(
          variant.stockQty,
          variant.lowStockAlertQty,
          variant.stockStatus,
        ),
      };
    });
  }

  async adjustments() {
    const [adjustments, variants] = await Promise.all([
      this.repository.adjustments(),
      this.repository.adjustmentVariants(),
    ]);
    const actorIds = [
      ...new Set(
        adjustments.flatMap(({ createdBy }) => (createdBy ? [createdBy] : [])),
      ),
    ];
    const actors = actorIds.length
      ? await this.repository.actors(actorIds)
      : [];
    const names = new Map(actors.map(({ id, name }) => [id, name]));

    return {
      movements: adjustments.map(({ variant, createdBy, ...movement }) => ({
        ...movement,
        sku: variant.sku,
        product: variant.product.name,
        variant: variant.name,
        user: createdBy ? (names.get(createdBy) ?? 'Unknown user') : 'System',
      })),
      variants: variants.map(({ id, sku, name, product }) => ({
        id,
        sku,
        variant: name,
        product: product.name,
      })),
    };
  }

  record(actorId: string, input: StockAdjustmentInput) {
    return this.repository.transaction(async (tx) => {
      // Claim the movement ID before changing stock so a retried request cannot apply it twice.
      const movement = { ...input, createdBy: actorId };
      const existing = await this.repository.findAdjustment(tx, input.id);
      if (existing) return this.confirmReplay(existing, movement);

      if (!(await this.repository.findVariant(tx, input.variantId))) {
        throw new NotFoundException(variantNotFound);
      }

      if (!(await this.repository.claimAdjustment(tx, movement))) {
        const recorded = await this.repository.findAdjustment(tx, input.id);
        if (recorded) return this.confirmReplay(recorded, movement);
        throw new ConflictException(
          'This adjustment ID has already been used.',
        );
      }

      const [variant] = await this.repository.adjustQuantity(
        tx,
        input.variantId,
        input.quantity,
      );
      if (!variant) {
        if (!(await this.repository.findVariant(tx, input.variantId))) {
          throw new NotFoundException(variantNotFound);
        }
        throw new ConflictException(
          input.quantity < 0
            ? 'The adjustment exceeds available stock.'
            : 'The adjustment exceeds the maximum stock quantity.',
        );
      }

      const status = resolveStockStatus(
        variant.stockQty,
        variant.lowStockAlertQty,
        variant.stockStatus,
      );
      if (status !== variant.stockStatus) {
        await this.repository.setStockStatus(tx, input.variantId, status);
      }
      return { id: input.id };
    });
  }

  async setThreshold(id: string, threshold: number) {
    try {
      const updated = await this.repository.setThreshold(id, threshold);
      return { id: updated.id, threshold: updated.lowStockAlertQty };
    } catch (error) {
      throwMappedPrismaError(error, { notFound: variantNotFound });
    }
  }

  private confirmReplay(
    existing: StockAdjustment,
    input: StockAdjustmentInput & { createdBy: string },
  ) {
    if (
      existing.createdBy !== input.createdBy ||
      existing.variantId !== input.variantId ||
      existing.type !== input.type ||
      existing.quantity !== input.quantity ||
      existing.reason !== input.reason
    ) {
      throw new ConflictException('This adjustment ID has already been used.');
    }
    return { id: existing.id };
  }
}
