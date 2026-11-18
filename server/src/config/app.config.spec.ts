import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfigService } from './app.config.js';

describe('AppConfigService', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('validates process environment during construction', () => {
    const values: Record<string, string> = {
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
      MAIL_FROM: 'noreply@example.com',
    };
    for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);

    expect(new AppConfigService().values).toMatchObject({
      NODE_ENV: 'test',
      PORT: 3000,
    });
  });
});
