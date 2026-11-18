import { z } from 'zod';

const email = z
  .email()
  .max(320)
  .transform((value) => value.trim().toLowerCase());
const phone = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format, for example +8801...');
const password = z
  .string()
  .min(12)
  .max(128)
  .refine(
    (value) => value.trim().length >= 12,
    'Password cannot be only whitespace',
  );
const code = z.string().regex(/^\d{6}$/);

export const emailSignupSchema = z.strictObject({ email, password });
export const updateProfileSchema = z.strictObject({ name: z.string().trim().min(2).max(100) });
export const emailLoginSchema = z.strictObject({ email, password });
export const emailOnlySchema = z.strictObject({ email });
export const phoneOnlySchema = z.strictObject({ phone });
export const verifyEmailSchema = z.strictObject({ email, code, password });
export const linkEmailVerifySchema = z.strictObject({ email, code, password });
export const phoneCodeSchema = z.strictObject({ phone, code });
export const phonePasswordSchema = z.strictObject({ phone, password });
export const phoneResetPasswordSchema = z.strictObject({ phone, code, password });
export const phoneSignupVerifySchema = phoneResetPasswordSchema.extend({
  name: z.string().trim().min(2).max(100),
});
export const resetPasswordSchema = z.strictObject({ email, code, password });
export const refreshSchema = z.strictObject({
  refreshToken: z.string().min(1),
});

export type EmailSignup = z.infer<typeof emailSignupSchema>;
export type EmailLogin = z.infer<typeof emailLoginSchema>;
export type EmailOnly = z.infer<typeof emailOnlySchema>;
export type PhoneOnly = z.infer<typeof phoneOnlySchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type LinkEmailVerify = z.infer<typeof linkEmailVerifySchema>;
export type PhoneCode = z.infer<typeof phoneCodeSchema>;
export type PhonePassword = z.infer<typeof phonePasswordSchema>;
export type PhoneResetPassword = z.infer<typeof phoneResetPasswordSchema>;
export type PhoneSignupVerify = z.infer<typeof phoneSignupVerifySchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type Refresh = z.infer<typeof refreshSchema>;
