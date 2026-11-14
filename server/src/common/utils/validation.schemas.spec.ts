import { describe, expect, it } from 'vitest';
import { slugSchema } from './validation.schemas.js';

describe('slugSchema', () => {
  it('keeps legacy validation permissive unless format checking is requested', () => {
    expect(slugSchema(100).safeParse('Upper Case').success).toBe(true);
    expect(slugSchema(100, true).safeParse('lower-kebab').success).toBe(true);
    expect(slugSchema(100, true).safeParse('Upper Case').success).toBe(false);
    expect(slugSchema(5).safeParse('too-long').success).toBe(false);
  });
});
