import { z } from 'zod';

const addressFields = {
  label: z.string().trim().max(100).nullable().optional(),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(7).max(20),
  thanaId: z.uuid(),
  addressLine: z.string().trim().min(1).max(500),
  postalCode: z.string().trim().max(20).nullable().optional(),
  isDefaultShipping: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
};

export const createAddressSchema = z.object(addressFields);
export const updateAddressSchema = z
  .object({
    label: addressFields.label,
    fullName: addressFields.fullName.optional(),
    phone: addressFields.phone.optional(),
    thanaId: addressFields.thanaId.optional(),
    addressLine: addressFields.addressLine.optional(),
    postalCode: addressFields.postalCode,
    isDefaultShipping: addressFields.isDefaultShipping,
    isDefaultBilling: addressFields.isDefaultBilling,
  })
  .refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');

export type CreateAddress = z.infer<typeof createAddressSchema>;
export type UpdateAddress = z.infer<typeof updateAddressSchema>;
