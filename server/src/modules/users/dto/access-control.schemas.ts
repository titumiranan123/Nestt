import { z } from 'zod';

export const updateRolePermissionsSchema = z
  .object({
    permissions: z.array(z.string().trim().min(1).max(120)).max(500),
  })
  .strict();

export type UpdateRolePermissions = z.infer<typeof updateRolePermissionsSchema>;
