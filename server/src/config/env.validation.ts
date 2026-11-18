import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  REDIS_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  OTP_HMAC_SECRET: z.string().min(32),
  PAYMENT_CONFIG_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'must be a 32-byte hexadecimal key')
    .refine(
      (key) => !/^([0-9a-fA-F])\1{63}$/.test(key),
      'must not be a repeated character',
    ),
  APP_BASE_URL: z.url(),
  SSL_COMMERZ_SANDBOX: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  SSL_COMMERZ_CALLBACK_BASE_URL: z.url().optional(),
  R2_PUBLIC_URL: z.url().optional(),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  SMS_API_URL: z.url().optional(),
  SMS_USERID: z.string().min(1).optional(),
  SMS_PASSWORD: z.string().min(1).optional(),
  SMS_MASKING: z.string().min(1).optional(),
  SMS_ACCOUNT_ID: z.string().min(1).optional(),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
}).superRefine((values, context) => {
  const smsSettings = [values.SMS_API_URL, values.SMS_USERID, values.SMS_PASSWORD, values.SMS_MASKING, values.SMS_ACCOUNT_ID];
  if (smsSettings.some(Boolean) && smsSettings.some((setting) => !setting)) {
    context.addIssue({ code: 'custom', path: ['SMS_API_URL'], message: 'Set the SMS gateway URL, user ID, password, masking and account ID together' });
  }
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnvironment(env: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse({ ...env, SMTP_PASSWORD: env.SMTP_PASS || env.SMTP_PASSWORD });
  if (!result.success) {
    throw new Error(
      `Invalid environment configuration: ${z.prettifyError(result.error)}`,
    );
  }

  const values = result.data;
  if (
    new Set([
      values.JWT_ACCESS_SECRET,
      values.JWT_REFRESH_SECRET,
      values.OTP_HMAC_SECRET,
      values.PAYMENT_CONFIG_ENCRYPTION_KEY,
    ]).size !== 4
  ) {
    throw new Error('Application secrets must be distinct');
  }
  if (values.NODE_ENV === 'production') {
    const {
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
      OTP_HMAC_SECRET,
      PAYMENT_CONFIG_ENCRYPTION_KEY,
      APP_BASE_URL,
    } = values;
    if (
      [
        JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET,
        OTP_HMAC_SECRET,
        PAYMENT_CONFIG_ENCRYPTION_KEY,
      ].some((secret) => secret.startsWith('replace-'))
    ) {
      throw new Error('Replace example auth secrets before production');
    }
    if (!APP_BASE_URL.startsWith('https://'))
      throw new Error('APP_BASE_URL must use HTTPS in production');
    if (values.SSL_COMMERZ_CALLBACK_BASE_URL && !values.SSL_COMMERZ_CALLBACK_BASE_URL.startsWith('https://'))
      throw new Error('SSL_COMMERZ_CALLBACK_BASE_URL must use HTTPS in production');
  }
  return {
    ...values,
    SWAGGER_ENABLED: values.SWAGGER_ENABLED ?? values.NODE_ENV !== 'production',
  };
}
