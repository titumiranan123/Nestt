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
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  MAIL_FROM: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_FROM: z.string().regex(/^\+[1-9]\d{7,14}$/),
  SWAGGER_ENABLED: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

export type AppConfig = z.infer<typeof envSchema>;

export function validateEnvironment(env: NodeJS.ProcessEnv): AppConfig {
  const result = envSchema.safeParse(env);
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
  }
  return {
    ...values,
    SWAGGER_ENABLED: values.SWAGGER_ENABLED ?? values.NODE_ENV !== 'production',
  };
}
