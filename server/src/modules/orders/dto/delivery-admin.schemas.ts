import { z } from 'zod';
import { deliveryZoneConfigSchema } from './order.schemas.js';

export const divisionSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
});

export const districtSchema = divisionSchema.extend({ divisionId: z.uuid() });

const fee = deliveryZoneConfigSchema.shape.minOrderFree.unwrap();
const zone = deliveryZoneConfigSchema.shape.zone;

export const thanaSchema = divisionSchema.extend({
  districtId: z.uuid(),
  deliveryZone: zone,
  shippingFee: fee,
  freeDeliveryAbove: fee,
  isDeliverable: z.boolean(),
});

export const updateThanaSchema = thanaSchema
  .partial()
  .refine(
    (input) => Object.keys(input).length > 0,
    'Choose at least one field to update.',
  );

export const bulkThanaSchema = z
  .strictObject({
    thanaIds: z.array(z.uuid()).min(1).max(10000),
    deliveryZone: zone.optional(),
    isDeliverable: z.boolean().optional(),
  })
  .refine(
    ({ deliveryZone, isDeliverable }) =>
      deliveryZone !== undefined || isDeliverable !== undefined,
    'Choose a delivery zone or deliverability status to update.',
  );

export const saveZoneSchema = deliveryZoneConfigSchema.refine(
  ({ estimatedDaysMin, estimatedDaysMax }) =>
    estimatedDaysMin == null ||
    estimatedDaysMax == null ||
    estimatedDaysMin <= estimatedDaysMax,
  {
    path: ['estimatedDaysMax'],
    message: 'Maximum ETA must be at least the minimum ETA.',
  },
);

export type DivisionInput = z.infer<typeof divisionSchema>;
export type DistrictInput = z.infer<typeof districtSchema>;
export type ThanaInput = z.infer<typeof thanaSchema>;
export type UpdateThanaInput = z.infer<typeof updateThanaSchema>;
export type BulkThanaInput = z.infer<typeof bulkThanaSchema>;
