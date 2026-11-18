import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChallengePurpose } from '../auth/challenge-purpose.js';
import { RedisAuthStore } from '../auth/redis-auth-store.service.js';
import { OtpService } from '../auth/services/otp.service.js';

@Injectable()
export class CheckoutPhoneService {
  constructor(private readonly otp: OtpService, private readonly redis: RedisAuthStore) {}

  async request(userId: string | undefined, target: string, phone: string, ip: string) {
    this.otp.assertPhoneDelivery();
    const phoneKey = this.otp.hash(ChallengePurpose.CHECKOUT_PHONE, phone, 'cooldown');
    if (!(await this.redis.hitLimit(`checkout-phone:cooldown:${phoneKey}`, 1, 45))) {
      throw new HttpException('Wait 45 seconds before requesting another code', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.otp.enforceLimit('checkout-phone-send', phone, ip);
    await this.otp.sendChallenge(ChallengePurpose.CHECKOUT_PHONE, target, userId, phone);
    return { phoneEnding: phone.slice(-4) };
  }

  async verify(userId: string | undefined, target: string, phone: string, code: string, ip: string) {
    await this.otp.enforceLimit('checkout-phone-verify', phone, ip, true);
    const hash = this.otp.hash(ChallengePurpose.CHECKOUT_PHONE, target, code);
    const accepted = await this.redis.consumeChallenge(ChallengePurpose.CHECKOUT_PHONE, target, hash, userId);
    if (!accepted) throw new BadRequestException('Invalid or expired verification code');
  }
}
