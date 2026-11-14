import { describe, expect, it } from 'vitest';
import {
  createOrderSchema,
  listOrdersSchema,
  shippingRateSchema,
  updateOrderStatusSchema,
} from './order.schemas.js';

const variantId = '11111111-1111-4111-8111-111111111111';
const address = {
  name: 'A Customer', phone: '+8801712345678', region: 'Dhaka', city: 'Dhaka',
  area: 'Gulshan', address: 'House 10, Road 1', postalCode: '1212',
};

describe('order request schemas', () => {
  it('validates a checkout request and supplies safe defaults', () => {
    expect(createOrderSchema.parse({
      items: [{ variantId, quantity: 2 }],
      shippingAddress: address,
    })).toMatchObject({ billingSameAsShipping: true, items: [{ quantity: 2 }] });
  });

  it('requires exactly one shipping address and unique product variants', () => {
    expect(createOrderSchema.safeParse({ items: [{ variantId, quantity: 1 }] }).success).toBe(false);
    expect(createOrderSchema.safeParse({ items: [{ variantId, quantity: 1 }], addressId: variantId, shippingAddress: address }).success).toBe(false);
    expect(createOrderSchema.safeParse({ items: [{ variantId, quantity: 1 }, { variantId, quantity: 2 }], shippingAddress: address }).success).toBe(false);
  });

  it('requires billing details for a separate billing address', () => {
    expect(createOrderSchema.safeParse({ items: [{ variantId, quantity: 1 }], shippingAddress: address, billingSameAsShipping: false }).success).toBe(false);
    expect(createOrderSchema.safeParse({ items: [{ variantId, quantity: 1 }], shippingAddress: address, billingSameAsShipping: false, billingAddress: address }).success).toBe(true);
  });

  it('coerces and bounds pagination, statuses, and shipping charges', () => {
    expect(listOrdersSchema.parse({ page: '2', pageSize: '25' })).toMatchObject({ page: 2, pageSize: 25 });
    expect(listOrdersSchema.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(updateOrderStatusSchema.safeParse({ status: 'DELIVERED' }).success).toBe(true);
    expect(updateOrderStatusSchema.safeParse({ status: 'PENDING' }).success).toBe(false);
    expect(shippingRateSchema.safeParse({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '120.50' }).success).toBe(true);
    expect(shippingRateSchema.safeParse({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '-1' }).success).toBe(false);
  });
});
