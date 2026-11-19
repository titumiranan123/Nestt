import { z } from 'zod';

export const brandInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(5000).nullable().optional(),
  logo: z.string().trim().max(500).nullable().optional(),
  verified: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  metaTitle: z.string().trim().max(160).nullable().optional(),
  metaDescription: z.string().trim().max(320).nullable().optional(),
  metaKeywords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
});
export type BrandInput = z.infer<typeof brandInputSchema>;
