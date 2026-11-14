import { createHmac, randomInt, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AppConfigService } from '../../../config/app.config.js';

@Injectable()
export class AuthCrypto {
  constructor(private readonly config: AppConfigService) {}

  newCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  newId(): string {
    return randomUUID();
  }

  codeHash(purpose: string, target: string, code: string): string {
    return createHmac('sha256', this.config.values.OTP_HMAC_SECRET)
      .update(`${purpose}\0${target}\0${code}`)
      .digest('hex');
  }

  tokenHash(token: string): string {
    return createHmac('sha256', this.config.values.OTP_HMAC_SECRET)
      .update(token)
      .digest('hex');
  }

  hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
