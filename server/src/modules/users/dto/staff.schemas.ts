import { z } from 'zod';

const staffRole = z.enum(['ADMIN', 'MANAGER', 'SUPPORT']);
const staffRoleFilter = z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPPORT']);
const staffStatus = z.enum(['ACTIVE', 'SUSPENDED']);
const email = z
  .email()
  .max(320)
  .transform((value) => value.trim().toLowerCase());
const phone = z
  .union([
    z
      .string()
      .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, for example +8801...'),
    z.literal(''),
  ])
  .nullable()
  .optional();
const password = z
  .string()
  .min(12)
  .max(128)
  .refine(
    (value) => value.trim().length >= 12,
    'Password cannot be only whitespace',
  );

export const listStaffSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: staffRoleFilter.optional(),
  status: staffStatus.optional(),
});

export const createStaffSchema = z.strictObject({
  name: z.string().trim().min(1).max(255),
  email,
  password,
  phone,
  role: staffRole,
  status: staffStatus.default('ACTIVE'),
  verified: z.boolean().default(false),
});

export const updateStaffSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(255).optional(),
    email: email.optional(),
    phone,
    role: staffRole.optional(),
    status: staffStatus.optional(),
    verified: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one field to update.',
  );

export const resetStaffPasswordSchema = z.strictObject({ password });

export type ListStaff = z.infer<typeof listStaffSchema>;
export type CreateStaff = z.infer<typeof createStaffSchema>;
export type UpdateStaff = z.infer<typeof updateStaffSchema>;
export type ResetStaffPassword = z.infer<typeof resetStaffPasswordSchema>;
