import { describe, expect, it } from 'vitest';
import { AuthCrypto } from './auth-crypto.service.js';
import type { AppConfigService } from '../../../config/app.config.js';

describe('AuthCrypto', () => {
  const crypto = new AuthCrypto({
    values: { OTP_HMAC_SECRET: 'a-long-secret-key-for-hmac-tests' },
  } as AppConfigService);

  it('generates six-digit codes and UUIDs', () => {
    expect(crypto.newCode()).toMatch(/^\d{6}$/);
    expect(crypto.newId()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('creates stable purpose-scoped and token hashes', () => {
    const challengeHash = crypto.codeHash('VERIFY_EMAIL', 'a@example.com', '123456');
    expect(challengeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(crypto.codeHash('VERIFY_EMAIL', 'a@example.com', '123456')).toBe(challengeHash);
    expect(crypto.codeHash('RESET_PASSWORD', 'a@example.com', '123456')).not.toBe(challengeHash);
    expect(crypto.tokenHash('token')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashes passwords and verifies correct and incorrect values', async () => {
    const hash = await crypto.hashPassword('a long password');
    await expect(crypto.verifyPassword(hash, 'a long password')).resolves.toBe(true);
    await expect(crypto.verifyPassword(hash, 'incorrect')).resolves.toBe(false);
  });
});
