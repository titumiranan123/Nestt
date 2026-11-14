import { describe, expect, it } from 'vitest';
import {
  createSeoMetaSchema,
  siteContentSchema,
  updateSeoMetaSchema,
} from './seo.schemas.js';

describe('SEO request schemas', () => {
  it('accepts SEO metadata and enforces the page name and title limits', () => {
    expect(
      createSeoMetaSchema.safeParse({
        pageName: 'home',
        metaTitle: 'Home page',
        metaDescription: 'Furniture for every room.',
        canonicalUrl: 'https://example.com/',
      }).success,
    ).toBe(true);
    expect(
      createSeoMetaSchema.safeParse({
        pageName: 'x'.repeat(51),
        metaTitle: 'Home',
        metaDescription: 'Description',
      }).success,
    ).toBe(false);
  });

  it('rejects malformed canonical URLs and empty required content', () => {
    expect(
      createSeoMetaSchema.safeParse({
        pageName: 'home',
        metaTitle: 'Home',
        metaDescription: 'Description',
        canonicalUrl: 'not-a-url',
      }).success,
    ).toBe(false);
    expect(siteContentSchema.safeParse({ content: '  ' }).success).toBe(false);
  });

  it('allows partial updates', () => {
    expect(updateSeoMetaSchema.safeParse({ metaTitle: 'Updated title' }).success).toBe(
      true,
    );
  });
});
