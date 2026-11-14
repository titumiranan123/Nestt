import { describe, expect, it } from 'vitest';
import { paginationOffset, paginationResult } from './pagination.js';

describe('pagination helpers', () => {
  it('calculates zero-based offsets', () => {
    expect(paginationOffset(1, 20)).toBe(0);
    expect(paginationOffset(3, 10)).toBe(20);
  });

  it('preserves the blog list response fields', () => {
    expect(
      paginationResult(['blog'], 21, 2, 10, {
        pageSizeKey: 'limit',
        includePages: true,
      }),
    ).toEqual({ items: ['blog'], total: 21, page: 2, limit: 10, pages: 3 });
  });

  it('preserves the order list response fields', () => {
    expect(
      paginationResult(['order'], 1, 1, 20, { pageSizeKey: 'pageSize' }),
    ).toEqual({ items: ['order'], total: 1, page: 1, pageSize: 20 });
  });
});
