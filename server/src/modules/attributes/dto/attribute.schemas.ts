import { z } from 'zod';
import { slugSchema } from '../../../common/utils/validation.schemas.js';

export const attributeTypeSchema = z.enum(['DROPDOWN']);

export const createAttributeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema(120),
  type: attributeTypeSchema.optional(),
  sortOrder: z.number().finite().optional(),
  isPublished: z.boolean().optional(),
  showInFilter: z.boolean().optional(),
});

export const updateAttributeSchema = createAttributeSchema.partial();

export const createAttributeOptionSchema = z.object({
  name: z.string().trim().min(1).max(100),
  value: z.string().trim().max(500).nullable().optional(),
  image: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().finite().optional(),
  isPublished: z.boolean().optional(),
});

export const updateAttributeOptionSchema =
  createAttributeOptionSchema.partial();

export type CreateAttribute = z.infer<typeof createAttributeSchema>;
export type UpdateAttribute = z.infer<typeof updateAttributeSchema>;
export type CreateAttributeOption = z.infer<typeof createAttributeOptionSchema>;
export type UpdateAttributeOption = z.infer<typeof updateAttributeOptionSchema>;
