import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ChallengePurpose } from '../challenge-purpose.js';
import { AppConfigService } from '../../../config/app.config.js';
import { RedisAuthStore } from '../redis-auth-store.service.js';
import { AuthCrypto } from './auth-crypto.service.js';
import { MailService } from '../../../providers/mail/mail.service.js';
import { SmsService } from '../../../providers/sms/sms.service.js';

@Injectable()
export class OtpService {
  constructor(
    private readonly redis: RedisAuthStore,
    private readonly crypto: AuthCrypto,
    private readonly mail: MailService,
    private readonly sms: SmsService,
    private readonly config: AppConfigService,
  ) {}

  hash(purpose: ChallengePurpose, target: string, code: string): string {
    return this.crypto.codeHash(purpose, target, code);
  }

  async enforceLimit(
    action: string,
    target: string,
    ip: string,
    verify = false,
  ): Promise<void> {
    const targetKey = this.crypto.tokenHash(`${action}:${target}`);
    const ipKey = this.crypto.tokenHash(`${action}:ip:${ip}`);
    const [targetAllowed, ipAllowed] = await Promise.all([
      this.redis.hitLimit(
        `target:${targetKey}`,
        verify ? 10 : 5,
        verify ? 600 : 3600,
      ),
      this.redis.hitLimit(`ip:${ipKey}`, verify ? 30 : 40, 3600),
    ]);
    if (!targetAllowed || !ipAllowed) {
      throw new HttpException(
        'Too many requests. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async sendChallenge(
    purpose: ChallengePurpose,
    target: string,
    userId?: string,
  ): Promise<void> {
    const code = this.crypto.newCode();
    const codeHash = this.crypto.codeHash(purpose, target, code);
    const record = await this.redis.issueChallenge(
      purpose,
      target,
      codeHash,
      userId,
    );
    try {
      if (
        purpose === ChallengePurpose.PHONE_LOGIN ||
        purpose === ChallengePurpose.LINK_PHONE
      ) {
        await this.sms.sendVerificationCode(target, code);
      } else {
        const subject =
          purpose === ChallengePurpose.RESET_PASSWORD
            ? 'Reset your Nestt password'
            : 'Verify your Nestt email';
        const link =
          purpose === ChallengePurpose.VERIFY_EMAIL ||
          purpose === ChallengePurpose.LINK_EMAIL
            ? `${this.config.values.APP_BASE_URL}/verify-email?email=${encodeURIComponent(target)}&code=${code}`
            : undefined;
        await this.mail.sendVerificationEmail(target, subject, code, link);
      }
    } catch (error) {
      await this.redis.deleteChallenge(
        purpose,
        target,
        userId,
        record.id,
      );
      throw error;
    }
  }

  isPublicMailFailure(error: unknown): boolean {
    return error instanceof ServiceUnavailableException;
  }
}
