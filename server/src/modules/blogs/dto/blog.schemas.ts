import { z } from 'zod';
import { slugSchema } from '../../../common/utils/validation.schemas.js';

const nullableText = (max: number) =>
  z.string().trim().max(max).nullable().optional();
const httpUrl = (max: number) => z.url({ protocol: /^https?$/ }).max(max);
const slug = slugSchema(255, true);

export const blogStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const blogImageSchema = z.object({
  url: httpUrl(1000),
  alt: nullableText(255),
  sortOrder: z.number().int().min(0).default(0),
});

export const createBlogSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug,
  content: z.string().min(1).max(100_000),
  excerpt: nullableText(5000),
  coverImage: httpUrl(1000).nullable().optional(),
  status: blogStatusSchema.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  readingTimeMin: z.number().int().positive().nullable().optional(),
  metaTitle: nullableText(255),
  metaDescription: nullableText(5000),
  categoryId: z.uuid().nullable().optional(),
  tagIds: z.array(z.uuid()).max(50).default([]),
  images: z.array(blogImageSchema).max(100).default([]),
});

export const updateBlogSchema = createBlogSchema.partial().extend({
  tagIds: z.array(z.uuid()).max(50).optional(),
  images: z.array(blogImageSchema).max(100).optional(),
});

export const blogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(255).optional(),
  tag: z.string().trim().max(100).optional(),
  status: blogStatusSchema.optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
});

export const createBlogCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema(100, true),
  description: nullableText(5000),
  coverImage: httpUrl(1000).nullable().optional(),
  isVisible: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

export const createBlogTagSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: slugSchema(100, true),
});
export const updateBlogTagSchema = createBlogTagSchema.partial();

export const footerSettingSchema = z.object({
  facebookUrl: httpUrl(500).nullable().optional(),
  messengerUrl: httpUrl(500).nullable().optional(),
  youtubeUrl: httpUrl(500).nullable().optional(),
  twitterUrl: httpUrl(500).nullable().optional(),
  tiktokUrl: httpUrl(500).nullable().optional(),
  linkedinUrl: httpUrl(500).nullable().optional(),
  instagramUrl: httpUrl(500).nullable().optional(),
  copyrightInfo: z.string().trim().min(1).max(1000),
  shortDescription: z.string().trim().min(1).max(2000),
});

export const policySettingKeys = [
  'policy_refund',
  'policy_privacy',
  'policy_terms',
  'policy_shipping',
] as const;

export const policySettingSchema = z.object({
  key: z.enum(policySettingKeys),
  value: z.string().trim().min(1).max(100_000),
});

export type CreateBlog = z.infer<typeof createBlogSchema>;
export type UpdateBlog = z.infer<typeof updateBlogSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type CreateBlogCategory = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategory = z.infer<typeof updateBlogCategorySchema>;
export type CreateBlogTag = z.infer<typeof createBlogTagSchema>;
export type UpdateBlogTag = z.infer<typeof updateBlogTagSchema>;
export type FooterSettingInput = z.infer<typeof footerSettingSchema>;
export type PolicySettingInput = z.infer<typeof policySettingSchema>;
