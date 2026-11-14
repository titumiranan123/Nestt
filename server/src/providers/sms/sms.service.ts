import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import twilio from 'twilio';
import { AppConfigService } from '../../config/app.config.js';

@Injectable()
export class SmsService {
  private readonly client;

  constructor(private readonly config: AppConfigService) {
    this.client = twilio(
      config.values.TWILIO_ACCOUNT_SID,
      config.values.TWILIO_AUTH_TOKEN,
    );
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.client.messages.create({
        from: this.config.values.TWILIO_FROM,
        to,
        body: `Your Nestt verification code is ${code}. It expires in 10 minutes.`,
      });
    } catch {
      throw new ServiceUnavailableException(
        'SMS delivery is temporarily unavailable',
      );
    }
  }
}
