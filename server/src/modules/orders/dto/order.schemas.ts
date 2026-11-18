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

const checkoutItemsSchema = z.array(z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(99),
})).min(1).max(50).refine(
  (items) => new Set(items.map(({ variantId }) => variantId)).size === items.length,
  { message: 'Each variant may only appear once; combine quantities.' },
);

export const quoteOrderSchema = z.object({
  items: checkoutItemsSchema,
  addressId: z.uuid().optional(),
  thanaId: z.uuid().optional(),
}).refine((value) => Boolean(value.addressId) !== Boolean(value.thanaId), {
  message: 'Select a saved address or a delivery area.',
});

export const publicCheckoutQuoteSchema = z.object({
  items: checkoutItemsSchema,
  thanaId: z.uuid(),
});

export const createOrderSchema = z
  .object({
    items: checkoutItemsSchema,
    checkoutId: z.uuid().optional(),
    expectedTotal: z.number().min(0).max(9999999999.99).optional(),
    contactEmail: z.email().trim().max(255).optional(),
    addressId: z.uuid().optional(),
    shippingAddress: shippingAddressSchema.optional(),
    paymentMethod: z.enum(['CASH_ON_DELIVERY', 'SSL_COMMERZ']).default('CASH_ON_DELIVERY'),
    billingSameAsShipping: z.boolean().default(true),
    billingAddress: shippingAddressSchema.optional(),
    emergencyContactPhone: z.string().trim().min(7).max(20).optional().nullable(),
    notes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.checkoutId && !value.contactEmail) {
      context.addIssue({ code: 'custom', path: ['contactEmail'], message: 'Enter an email address for order updates.' });
    }
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

export type QuoteOrder = z.infer<typeof quoteOrderSchema>;

export const storefrontCheckoutSchema = createOrderSchema.safeExtend({
  checkoutId: z.uuid(),
  expectedTotal: z.number().min(0).max(9999999999.99),
  contactEmail: z.email().trim().max(255),
  emergencyContactPhone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Enter a valid emergency contact phone number.'),
});
export const submitCheckoutSchema = storefrontCheckoutSchema.safeExtend({
  code: z.string().regex(/^\d{6}$/, 'Enter the six-digit verification code'),
});
const publicCheckoutBase = storefrontCheckoutSchema.safeExtend({
  shippingAddress: shippingAddressSchema,
});
export const publicStorefrontCheckoutSchema = publicCheckoutBase.refine((value) => !value.addressId, {
  path: ['shippingAddress'],
  message: 'Checkout requires a delivery address.',
});
export const submitPublicCheckoutSchema = publicCheckoutBase.safeExtend({
  code: z.string().regex(/^\d{6}$/, 'Enter the six-digit verification code'),
}).refine((value) => !value.addressId, {
  path: ['shippingAddress'],
  message: 'Checkout requires a delivery address.',
});
export type SubmitCheckout = z.infer<typeof submitCheckoutSchema>;
export type PublicStorefrontCheckout = z.infer<typeof publicStorefrontCheckoutSchema>;
export type SubmitPublicCheckout = z.infer<typeof submitPublicCheckoutSchema>;

export const createAdminOrderSchema = z.object({
  items: z.array(z.object({ variantId: z.uuid(), quantity: z.number().int().min(1).max(99) }))
    .min(1)
    .max(50)
    .refine((items) => new Set(items.map(({ variantId }) => variantId)).size === items.length, {
      message: 'Each variant may only appear once; combine quantities.',
    }),
  customerName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(20),
  emergencyContactPhone: z.string().trim().min(7).max(20).optional().nullable(),
  email: z.email().trim().max(255).optional().nullable(),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  shippingThanaId: z.uuid().optional().nullable(),
  shippingAddress: z.string().trim().min(1).max(500).optional().nullable(),
  shippingPostalCode: z.string().trim().max(20).optional().nullable(),
  paymentMethod: z.enum(['CASH', 'CASH_ON_DELIVERY', 'SSL_COMMERZ', 'BANK_TRANSFER']).default('CASH'),
  paymentStatus: z.enum(['UNPAID', 'PENDING', 'PAID']).default('PAID'),
  paymentReference: z.string().trim().max(255).optional().nullable(),
  discountAmount: z.coerce.number().min(0).max(10000000).default(0),
  source: z.enum(['POS', 'PHONE']).default('POS'),
  notes: z.string().trim().max(2000).optional().nullable(),
}).superRefine((value, context) => {
  if (value.fulfillmentType === 'DELIVERY' && (!value.shippingThanaId || !value.shippingAddress)) {
    context.addIssue({ code: 'custom', path: ['shippingThanaId'], message: 'A delivery area and address are required for delivery orders.' });
  }
  if (value.fulfillmentType === 'PICKUP' && value.source !== 'POS') {
    context.addIssue({ code: 'custom', path: ['fulfillmentType'], message: 'Pickup is only available for POS orders.' });
  }
});

export const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PENDING', 'PAID', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED']).optional(),
  search: z.string().trim().max(100).optional(),
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

export const updateDeliveryAreaSchema = z.object({
  thana: z.string().trim().min(1).max(100),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  shippingFee: feeSchema.optional(),
  isDeliverable: z.boolean(),
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
export type CreateAdminOrder = z.infer<typeof createAdminOrderSchema>;
export type ListOrders = z.infer<typeof listOrdersSchema>;
export type CancelOrder = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatus = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatus = z.infer<typeof updatePaymentStatusSchema>;
export type CreateOrderRemark = z.infer<typeof createOrderRemarkSchema>;
export type RequestReturn = z.infer<typeof requestReturnSchema>;
export type UpdateReturnStatus = z.infer<typeof updateReturnStatusSchema>;
export type DeliveryAreaInput = z.infer<typeof deliveryAreaSchema>;
export type UpdateDeliveryAreaInput = z.infer<typeof updateDeliveryAreaSchema>;
export type DeliveryZoneConfigInput = z.infer<typeof deliveryZoneConfigSchema>;
