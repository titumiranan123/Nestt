import { z } from 'zod';

const placementSchema = z.strictObject({
  id: z.string().trim().min(1).max(80),
  productVariantId: z.uuid().optional(),
  slug: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().max(255).optional(),
  x: z.number().finite().min(-100).max(100),
  y: z.number().finite().min(-100).max(100),
  z: z.number().finite().min(-100).max(100),
  rotation: z.number().finite().min(-3600).max(3600),
});

export const roomDesignSchema = z.strictObject({
  width: z.number().finite().min(1).max(100),
  length: z.number().finite().min(1).max(100),
  items: z.array(placementSchema).max(50),
});

export const saveARDesignSchema = z.strictObject({
  title: z.string().trim().min(1).max(120).default('My room design'),
  room: roomDesignSchema,
});

export const updateARDesignSchema = z.strictObject({
  title: z.string().trim().min(1).max(120).optional(),
  room: roomDesignSchema.optional(),
  shareEnabled: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export type SaveARDesign = z.infer<typeof saveARDesignSchema>;
export type UpdateARDesign = z.infer<typeof updateARDesignSchema>;
