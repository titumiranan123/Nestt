import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '../../config/app.config.js';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

@Injectable()
export class PaymentConfigCryptoService {
  private readonly key: Buffer;

  constructor(config: AppConfigService) {
    this.key = Buffer.from(config.values.PAYMENT_CONFIG_ENCRYPTION_KEY, 'hex');
    if (this.key.length !== 32) {
      throw new Error('PAYMENT_CONFIG_ENCRYPTION_KEY must decode to 32 bytes');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    return [
      VERSION,
      iv.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join(':');
  }

  decrypt(envelope: string): string {
    const [version, ivEncoded, tagEncoded, ciphertextEncoded, extra] =
      envelope.split(':');
    if (
      version !== VERSION ||
      !ivEncoded ||
      !tagEncoded ||
      ciphertextEncoded === undefined ||
      extra !== undefined
    ) {
      throw new InternalServerErrorException(
        'Stored payment credential has an unsupported format',
      );
    }

    try {
      const decipher = createDecipheriv(
        ALGORITHM,
        this.key,
        Buffer.from(ivEncoded, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextEncoded, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Unable to decrypt stored payment credential',
      );
    }
  }
}
