import { z } from 'zod';

const optionalSecret = z.string().trim().min(1).optional();
const optionalText = (max: number) =>
  z.string().trim().min(1).max(max).optional();
export const sslConfigSchema = z
  .strictObject({
    storeId: optionalText(255),
    storePass: optionalSecret,
    status: z.boolean().optional(),
  })
  .refine(
    (input) => Object.keys(input).length > 0,
    'Change at least one payment setting.',
  );

export type SslConfigInput = z.infer<typeof sslConfigSchema>;
