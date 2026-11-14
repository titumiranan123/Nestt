import { describe, expect, it } from 'vitest';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.schemas.js';

describe('category request schemas', () => {
  it('defaults category keywords to an empty list', () => {
    expect(
      createCategorySchema.parse({ name: 'Chairs', slug: 'chairs' }).metaKeywords,
    ).toEqual([]);
  });

  it('rejects names, slugs, and sort orders outside supported bounds', () => {
    expect(
      createCategorySchema.safeParse({
        name: 'x'.repeat(101),
        slug: 'chairs',
      }).success,
    ).toBe(false);
    expect(
      createCategorySchema.safeParse({
        name: 'Chairs',
        slug: 'x'.repeat(101),
      }).success,
    ).toBe(false);
    expect(
      updateCategorySchema.safeParse({ sortOrder: Number.NaN }).success,
    ).toBe(false);
  });

  it('accepts nullable parent ids to move a category to the root', () => {
    expect(updateCategorySchema.safeParse({ parentId: null }).success).toBe(true);
  });
});
