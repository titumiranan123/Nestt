import { describe, expect, it } from 'vitest';
import type { AppConfigService } from '../../config/app.config.js';
import { PaymentConfigCryptoService } from './payment-config-crypto.service.js';

const key = '0123456789abcdef'.repeat(4);

function createCrypto(configKey = key) {
  return new PaymentConfigCryptoService({
    values: { PAYMENT_CONFIG_ENCRYPTION_KEY: configKey },
  } as AppConfigService);
}

describe('PaymentConfigCryptoService', () => {
  it('encrypts with randomized authenticated ciphertext and decrypts it', () => {
    const crypto = createCrypto();
    const first = crypto.encrypt('gateway-secret');
    const second = crypto.encrypt('gateway-secret');

    expect(first).not.toBe(second);
    expect(first).not.toContain('gateway-secret');
    expect(crypto.decrypt(first)).toBe('gateway-secret');
  });

  it('rejects invalid key lengths, unsupported versions and tampering', () => {
    expect(() => createCrypto('abc')).toThrow('32 bytes');
    const crypto = createCrypto();
    expect(() => crypto.decrypt('v2:iv:tag:data')).toThrow(
      'unsupported format',
    );
    const [version, iv, tag] = crypto.encrypt('secret').split(':');
    expect(() => crypto.decrypt(`${version}:${iv}:${tag}:AAAA`)).toThrow(
      'Unable to decrypt',
    );
    expect(() => crypto.decrypt('v1:iv:tag')).toThrow('unsupported format');
  });
});
