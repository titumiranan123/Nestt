import { describe, expect, it } from 'vitest';
import { sslConfigSchema } from './payment-config.schemas.js';

describe('SSLCommerz settings schema', () => {
  it('permits credential and status updates independently', () => {
    expect(sslConfigSchema.parse({ storeId: 'merchant-id' })).toEqual({
      storeId: 'merchant-id',
    });
    expect(sslConfigSchema.safeParse({ storePass: '   ' }).success).toBe(false);
    expect(sslConfigSchema.parse({ status: false })).toEqual({ status: false });
  });

  it('rejects empty updates and unexpected properties', () => {
    expect(sslConfigSchema.safeParse({}).success).toBe(false);
    expect(
      sslConfigSchema.safeParse({ status: true, isAdmin: true }).success,
    ).toBe(false);
  });
});
