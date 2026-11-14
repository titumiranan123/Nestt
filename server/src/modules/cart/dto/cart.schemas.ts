import { z } from 'zod';

export const cartItemSchema = z.strictObject({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.strictObject({
  quantity: z.number().int().min(1).max(99),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
