import { z } from 'zod';
import { emailSignupSchema } from '../../auth/dto/auth.schemas.js';

export const CUSTOMER_AVATAR_LIMIT = 5 * 1024 * 1024;
const status = z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']);
const email = z
  .string()
  .trim()
  .pipe(z.email().max(320))
  .transform((value) => value.toLowerCase());
const phone = z
  .string()
  .trim()
  .pipe(
    z.union([
      z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, for example +8801...'),
      z.literal(''),
    ]),
  )
  .transform((value) => value || null);

const dateFields = {
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
};

function validDates(input: { from?: string; to?: string }) {
  return !input.from || !input.to || input.from <= input.to;
}

export const exportCustomersSchema = z
  .object(dateFields)
  .refine(validDates, 'The start date must be on or before the end date.');
export const listCustomersSchema = z
  .object({
    ...dateFields,
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(255).optional(),
    status: status.optional(),
    verification: z.enum(['VERIFIED', 'PENDING']).optional(),
  })
  .refine(validDates, 'The start date must be on or before the end date.');

const customerFields = z.strictObject({
  name: z.string().trim().min(1).max(255),
  email: z.union([email, z.literal('')]).transform((value) => value || null),
  phone,
  location: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value || null),
  status,
  isEmailVerified: z.boolean(),
  isPhoneVerified: z.boolean(),
});

function parseMultipartProfile(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export const createCustomerSchema = z.preprocess(
  parseMultipartProfile,
  customerFields.extend({
    email,
    password: emailSignupSchema.shape.password,
  }),
);

export const updateCustomerSchema = z.preprocess(
  parseMultipartProfile,
  customerFields
    .partial()
    .refine(
      (input) => Object.keys(input).length > 0,
      'Provide at least one customer field to update.',
    ),
);

export type ListCustomers = z.infer<typeof listCustomersSchema>;
export type ExportCustomers = z.infer<typeof exportCustomersSchema>;
export type CreateCustomer = z.infer<typeof createCustomerSchema>;
export type UpdateCustomer = z.infer<typeof updateCustomerSchema>;
