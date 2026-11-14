import { z } from 'zod';

const shippingAddressSchema = z.object({
  thanaId: z.uuid(),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(20),
  region: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  area: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
  postalCode: z.string().trim().max(20).optional().nullable(),
});

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          variantId: z.uuid(),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .min(1)
      .max(50)
      .refine((items) => new Set(items.map(({ variantId }) => variantId)).size === items.length, {
        message: 'Each variant may only appear once; combine quantities.',
      }),
    addressId: z.uuid().optional(),
    shippingAddress: shippingAddressSchema.optional(),
    paymentMethod: z.enum(['CASH_ON_DELIVERY', 'SSL_COMMERZ']).default('CASH_ON_DELIVERY'),
    billingSameAsShipping: z.boolean().default(true),
    billingAddress: shippingAddressSchema.optional(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.addressId) === Boolean(value.shippingAddress)) {
      context.addIssue({
        code: 'custom',
        path: ['shippingAddress'],
        message: 'Provide exactly one saved address id or a shipping address.',
      });
    }
    if (!value.billingSameAsShipping && !value.billingAddress) {
      context.addIssue({
        code: 'custom',
        path: ['billingAddress'],
        message: 'Billing address is required when it differs from shipping.',
      });
    }
  });

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1).max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().trim().max(1000).optional(),
  isPublic: z.boolean().default(true),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['PAID', 'FAILED']),
  reference: z.string().trim().max(255).optional(),
});

export const createOrderRemarkSchema = z.object({
  note: z.string().trim().min(1).max(1000),
  isInternal: z.boolean().default(true),
});

export const requestReturnSchema = z.object({
  itemId: z.uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const updateReturnStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'RECEIVED']),
  note: z.string().trim().max(1000).optional(),
});

const feeSchema = z
  .string()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Fee must be a non-negative amount with at most two decimals.')
  .nullable();

export const deliveryAreaSchema = z.object({
  division: z.string().trim().min(1).max(100),
  district: z.string().trim().min(1).max(100),
  thana: z.string().trim().min(1).max(100),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  shippingFee: feeSchema.optional(),
  isDeliverable: z.boolean().default(true),
  freeDeliveryAbove: feeSchema.optional(),
});

export const deliveryZoneConfigSchema = z.object({
  zone: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  flatFee: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/),
  isFree: z.boolean().default(false),
  minOrderFree: feeSchema.optional(),
  estimatedDaysMin: z.number().int().min(0).nullable().optional(),
  estimatedDaysMax: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().default(true),
});

export type CreateOrder = z.infer<typeof createOrderSchema>;
export type ListOrders = z.infer<typeof listOrdersSchema>;
export type CancelOrder = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatus = z.infer<typeof updatePaymentStatusSchema>;
export type CreateOrderRemark = z.infer<typeof createOrderRemarkSchema>;
export type RequestReturn = z.infer<typeof requestReturnSchema>;
export type UpdateReturnStatus = z.infer<typeof updateReturnStatusSchema>;
export type DeliveryAreaInput = z.infer<typeof deliveryAreaSchema>;
export type DeliveryZoneConfigInput = z.infer<typeof deliveryZoneConfigSchema>;
