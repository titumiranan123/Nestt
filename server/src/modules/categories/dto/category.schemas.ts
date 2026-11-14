import { z } from 'zod';
import { slugSchema } from '../../../common/utils/validation.schemas.js';

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema(100),
  description: z.string().trim().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().finite().optional(),
  logo: nullableText(255),
  isPublished: z.boolean().optional(),
  metaTitle: nullableText(160),
  metaDescription: nullableText(320),
  metaKeywords: z.array(z.string().trim().min(1)).default([]),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
