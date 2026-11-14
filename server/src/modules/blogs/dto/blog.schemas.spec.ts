import { describe, expect, it } from 'vitest';
import {
  blogListQuerySchema,
  createBlogCategorySchema,
  createBlogSchema,
  createBlogTagSchema,
  footerSettingSchema,
  policySettingSchema,
  updateBlogSchema,
} from './blog.schemas.js';

describe('blog request schemas', () => {
  it('accepts a blog draft with defaults and valid relations', () => {
    const parsed = createBlogSchema.parse({
      title: 'A useful guide',
      slug: 'useful-guide',
      content: 'Body',
      categoryId: '00000000-0000-4000-8000-000000000001',
      tagIds: ['00000000-0000-4000-8000-000000000002'],
      images: [{ url: 'https://cdn.example.com/one.jpg' }],
    });
    expect(parsed.status).toBe('DRAFT');
    expect(parsed.isFeatured).toBe(false);
    expect(parsed.images[0].sortOrder).toBe(0);
  });

  it('rejects non-blog status, unsafe slugs, invalid urls, and invalid UUIDs', () => {
    expect(
      createBlogSchema.safeParse({ title: 'T', slug: 'bad slug', content: 'x' })
        .success,
    ).toBe(false);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x',
        status: 'IDEA',
      }).success,
    ).toBe(false);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x',
        categoryId: 'nope',
      }).success,
    ).toBe(false);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x',
        coverImage: 'not-url',
      }).success,
    ).toBe(false);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x',
        coverImage: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x',
        images: [{ url: 'http://cdn.example.com/image.png' }],
      }).success,
    ).toBe(true);
    expect(
      createBlogSchema.safeParse({
        title: 'T',
        slug: 'good',
        content: 'x'.repeat(100_001),
      }).success,
    ).toBe(false);
  });

  it('validates list pagination and supports optional filters', () => {
    expect(
      blogListQuerySchema.parse({
        page: '2',
        limit: '10',
        search: 'chair',
        featured: 'true',
      }),
    ).toMatchObject({
      page: 2,
      limit: 10,
      search: 'chair',
      featured: true,
      sort: 'newest',
    });
    expect(blogListQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(blogListQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('parses featured query strings explicitly and rejects invalid values', () => {
    expect(blogListQuerySchema.parse({ featured: 'true' }).featured).toBe(true);
    expect(blogListQuerySchema.parse({ featured: 'false' }).featured).toBe(
      false,
    );
    expect(blogListQuerySchema.parse({}).featured).toBeUndefined();
    expect(blogListQuerySchema.safeParse({ featured: 'yes' }).success).toBe(
      false,
    );
  });

  it('validates category, tag, footer and allowlisted policy payloads', () => {
    expect(
      createBlogCategorySchema.safeParse({ name: 'Guides', slug: 'guides' })
        .success,
    ).toBe(true);
    expect(
      createBlogTagSchema.safeParse({ name: 'Living', slug: 'living' }).success,
    ).toBe(true);
    expect(
      footerSettingSchema.safeParse({
        copyrightInfo: '© 2026',
        shortDescription: 'About us',
      }).success,
    ).toBe(true);
    expect(
      footerSettingSchema.safeParse({
        copyrightInfo: '',
        shortDescription: 'x',
      }).success,
    ).toBe(false);
    expect(
      footerSettingSchema.safeParse({
        copyrightInfo: '©',
        shortDescription: 'Store',
        facebookUrl: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    expect(
      policySettingSchema.safeParse({ key: 'policy_privacy', value: 'Privacy' })
        .success,
    ).toBe(true);
    expect(
      policySettingSchema.safeParse({ key: 'payment_secret', value: 'secret' })
        .success,
    ).toBe(false);
    expect(updateBlogSchema.safeParse({ isFeatured: true }).success).toBe(true);
  });
});
