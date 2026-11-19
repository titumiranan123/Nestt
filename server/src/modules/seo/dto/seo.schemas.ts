import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const createSeoMetaSchema = z.object({
  pageName: z.string().trim().min(1).max(50),
  metaTitle: z.string().trim().min(1).max(255),
  metaDescription: z.string().trim().min(1),
  metaKeywords: optionalText(2000),
  canonicalUrl: z
    .union([z.url({ protocol: /^https?$/ }).trim().max(255), z.literal('')])
    .optional()
    .nullable(),
  metaRobots: optionalText(50),
  schema: z.string().optional().nullable(),
  twitterCardType: optionalText(50),
});

export const updateSeoMetaSchema = createSeoMetaSchema
  .omit({ pageName: true })
  .partial();

export const siteContentSchema = z.object({
  content: z.string().trim().min(1).max(2_000_000),
});

export const siteSitemapSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1)
    .max(2_000_000)
    .refine((content) => {
      if (!content.includes('<urlset') || !content.includes('</urlset>'))
        return false;
      const locations = [...content.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)];
      return (
        locations.length > 0 &&
        locations.every(([, location]) => {
          if (!location) return false;
          try {
            const url = new URL(location.trim());
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        })
      );
    }, 'Sitemap must contain a urlset and at least one absolute HTTP(S) location.'),
});

export type CreateSeoMeta = z.infer<typeof createSeoMetaSchema>;
export type UpdateSeoMeta = z.infer<typeof updateSeoMetaSchema>;
export type SiteContent = z.infer<typeof siteContentSchema>;
