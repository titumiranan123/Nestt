import { z } from 'zod';

const nullablePositiveAmount = z.number().finite().min(0).nullable();
const nullableNonNegativeInt = z.number().int().min(0).nullable();

const couponFieldsSchema = z.object({
  code: z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9_]+$/).transform((value) => value.toUpperCase()),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().finite().positive(),
  minOrder: nullablePositiveAmount,
  maxDiscount: nullablePositiveAmount,
  expiresAt: z.coerce.date().nullable(),
  usageLimit: nullableNonNegativeInt,
  userLimit: nullableNonNegativeInt,
  isActive: z.boolean(),
});

export const couponInputSchema = couponFieldsSchema.superRefine((value, context) => {
  if (value.discountType === 'PERCENTAGE' && value.discountValue > 100) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage discounts cannot exceed 100.' });
  }
  if (value.discountType === 'FIXED' && value.maxDiscount !== null) {
    context.addIssue({ code: 'custom', path: ['maxDiscount'], message: 'Maximum discount applies only to percentage coupons.' });
  }
});

export const couponUpdateSchema = couponFieldsSchema.partial().superRefine((value, context) => {
  if (value.discountType === 'FIXED' && value.maxDiscount != null) {
    context.addIssue({ code: 'custom', path: ['maxDiscount'], message: 'Maximum discount applies only to percentage coupons.' });
  }
  if (value.discountType === 'PERCENTAGE' && value.discountValue != null && value.discountValue > 100) {
    context.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage discounts cannot exceed 100.' });
  }
});

export type CouponInput = z.infer<typeof couponInputSchema>;
export type CouponUpdate = z.infer<typeof couponUpdateSchema>;
