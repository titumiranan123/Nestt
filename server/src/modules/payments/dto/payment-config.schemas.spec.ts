import { describe, expect, it } from 'vitest';
import {
  bkashConfigSchema,
  nagadConfigSchema,
  sslConfigSchema,
} from './payment-config.schemas.js';

describe('payment provider schemas', () => {
  it('validates provider values and permits secret-safe partial updates', () => {
    expect(bkashConfigSchema.parse({ status: true })).toEqual({ status: true });
    expect(bkashConfigSchema.safeParse({ baseUrl: 'nope' }).success).toBe(
      false,
    );
    expect(
      nagadConfigSchema.parse({ merchantNumber: null, isActive: false }),
    ).toEqual({ merchantNumber: null, isActive: false });
    expect(sslConfigSchema.parse({ storeId: 'merchant-id' })).toEqual({
      storeId: 'merchant-id',
    });
    expect(sslConfigSchema.safeParse({ storePass: '   ' }).success).toBe(false);
  });

  it('rejects unexpected properties instead of persisting unvalidated input', () => {
    expect(
      bkashConfigSchema.safeParse({ password: 'secret', isAdmin: true })
        .success,
    ).toBe(false);
  });
});
