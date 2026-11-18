import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation.js';

function validEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/nestt',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'access-secret-that-is-at-least-32-characters',
    JWT_REFRESH_SECRET: 'refresh-secret-that-is-at-least-32-characters',
    OTP_HMAC_SECRET: 'otp-secret-that-is-at-least-32-characters',
    PAYMENT_CONFIG_ENCRYPTION_KEY:
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    APP_BASE_URL: 'http://localhost:3000',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_USER: 'user',
    SMTP_PASSWORD: 'password',
    MAIL_FROM: 'Nestt <noreply@example.com>',
    ...overrides,
  };
}

describe('validateEnvironment', () => {
  it('accepts the Resend password setting and optional SMS config', () => {
    const config = validateEnvironment(validEnv({ SMTP_PASSWORD: undefined, SMTP_PASS: 'smtp-test-key' }));
    expect(config.SMTP_PASSWORD).toBe('smtp-test-key');
    expect(() => validateEnvironment(validEnv({ SMS_API_URL: 'https://sms.example.test' }))).toThrow('Set the SMS gateway URL');
  });

  it('applies development defaults and transforms validated values', () => {
    const config = validateEnvironment(
      validEnv({ NODE_ENV: undefined, PORT: undefined }),
    );
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.TRUST_PROXY_HOPS).toBe(0);
    expect(config.SWAGGER_ENABLED).toBe(true);
  });

  it('parses explicit boolean, integer and optional URL settings', () => {
    const config = validateEnvironment(
      validEnv({
        PORT: '8080',
        TRUST_PROXY_HOPS: '2',
        SWAGGER_ENABLED: 'false',
      }),
    );
    expect(config).toMatchObject({
      PORT: 8080,
      TRUST_PROXY_HOPS: 2,
      SWAGGER_ENABLED: false,
    });
  });

  it('rejects malformed environment values and repeated auth secrets', () => {
    expect(() =>
      validateEnvironment(validEnv({ DATABASE_URL: 'mysql://localhost/db' })),
    ).toThrow('Invalid environment configuration');
    expect(() =>
      validateEnvironment(
        validEnv({
          JWT_REFRESH_SECRET: 'access-secret-that-is-at-least-32-characters',
        }),
      ),
    ).toThrow('Application secrets must be distinct');
    expect(() =>
      validateEnvironment(
        validEnv({
          JWT_ACCESS_SECRET:
            '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        }),
      ),
    ).toThrow('Application secrets must be distinct');
    expect(() =>
      validateEnvironment(validEnv({ PAYMENT_CONFIG_ENCRYPTION_KEY: 'short' })),
    ).toThrow('Invalid environment configuration');
    expect(() =>
      validateEnvironment(
        validEnv({ PAYMENT_CONFIG_ENCRYPTION_KEY: '0'.repeat(64) }),
      ),
    ).toThrow('Invalid environment configuration');
  });

  it('requires secure production settings and disables Swagger by default', () => {
    expect(() =>
      validateEnvironment(validEnv({ NODE_ENV: 'production' })),
    ).toThrow('APP_BASE_URL must use HTTPS in production');
    expect(() =>
      validateEnvironment(
        validEnv({
          NODE_ENV: 'production',
          APP_BASE_URL: 'https://nestt.example',
          JWT_ACCESS_SECRET: 'replace-access-secret-that-is-at-least-32',
        }),
      ),
    ).toThrow('Replace example auth secrets before production');
    expect(() =>
      validateEnvironment(
        validEnv({
          NODE_ENV: 'production',
          APP_BASE_URL: 'https://nestt.example',
          PAYMENT_CONFIG_ENCRYPTION_KEY:
            'replace0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        }),
      ),
    ).toThrow('Invalid environment configuration');
    const config = validateEnvironment(
      validEnv({
        NODE_ENV: 'production',
        APP_BASE_URL: 'https://nestt.example',
      }),
    );
    expect(config.SWAGGER_ENABLED).toBe(false);
  });
});
