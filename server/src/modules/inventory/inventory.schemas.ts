import { AdjustmentType } from '@prisma/client';
import { z } from 'zod';
import {
  isAdjustmentQuantityAllowed,
  MAX_INVENTORY_QUANTITY,
} from './inventory.utils.js';

export const stockThresholdSchema = z.object({
  threshold: z.number().int().min(0).max(MAX_INVENTORY_QUANTITY),
});

export const stockAdjustmentSchema = z
  .object({
    id: z.uuid(),
    variantId: z.uuid(),
    type: z.enum(AdjustmentType),
    quantity: z
      .number()
      .int()
      .min(-MAX_INVENTORY_QUANTITY)
      .max(MAX_INVENTORY_QUANTITY),
    reason: z.string().trim().min(1).max(255),
  })
  .refine(({ quantity, type }) => isAdjustmentQuantityAllowed(type, quantity), {
    path: ['quantity'],
    message:
      'Enter a nonzero quantity in the direction allowed for this movement.',
  });

export type StockThresholdInput = z.infer<typeof stockThresholdSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
