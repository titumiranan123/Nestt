import { describe, expect, it } from 'vitest';
import {
  createAttributeOptionSchema,
  createAttributeSchema,
  updateAttributeOptionSchema,
} from './attribute.schemas.js';

describe('attribute request schemas', () => {
  it('accepts supported attribute fields and rejects unknown enum values', () => {
    expect(
      createAttributeSchema.safeParse({
        name: 'Material',
        slug: 'material',
        type: 'DROPDOWN',
        showInFilter: true,
      }).success,
    ).toBe(true);
    expect(
      createAttributeSchema.safeParse({
        name: 'Material',
        slug: 'material',
        type: 'COLOR',
      }).success,
    ).toBe(false);
  });

  it('validates option field lengths and supports partial option updates', () => {
    expect(
      createAttributeOptionSchema.safeParse({ name: 'Oak', value: 'oak' }).success,
    ).toBe(true);
    expect(
      createAttributeOptionSchema.safeParse({
        name: 'x'.repeat(101),
      }).success,
    ).toBe(false);
    expect(updateAttributeOptionSchema.safeParse({ image: null }).success).toBe(true);
  });
});
