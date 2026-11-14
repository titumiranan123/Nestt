import { z } from 'zod';

export const upsertARProductAssetSchema = z.strictObject({
  modelUrl: z.url().max(1000),
  dimensionsMm: z.tuple([
    z.number().positive().max(10000),
    z.number().positive().max(10000),
    z.number().positive().max(10000),
  ]),
  placement: z.enum(['floor', 'wall']).default('floor'),
  isPublished: z.boolean().default(false),
});

export type UpsertARProductAsset = z.infer<typeof upsertARProductAssetSchema>;
