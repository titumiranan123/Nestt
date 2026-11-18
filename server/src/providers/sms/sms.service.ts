import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { AppConfigService } from '../../config/app.config.js';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: AppConfigService) {
    const url = config.values.SMS_API_URL;
    if (url && new URL(url).protocol === 'http:' && config.values.NODE_ENV === 'development') {
      this.logger.warn('SMS is using the configured HTTP gateway in development; use HTTPS in production.');
    }
  }

  private settings() {
    const { SMS_API_URL: endpoint, SMS_USERID: userid, SMS_PASSWORD: password,
      SMS_MASKING: masking, SMS_ACCOUNT_ID: accountid } = this.config.values;
    if (!endpoint || !userid || !password || !masking || !accountid) {
      throw new ServiceUnavailableException('SMS delivery is not configured');
    }
    const url = new URL(endpoint);
    const developmentHttpGateway = this.config.values.NODE_ENV === 'development' && url.protocol === 'http:';
    if ((url.protocol !== 'https:' && !developmentHttpGateway) || url.username || url.password) {
      throw new ServiceUnavailableException('SMS delivery requires HTTPS outside development');
    }
    return { url, userid, password, masking };
  }

  assertAvailable() {
    this.settings();
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const { url, ...credentials } = this.settings();
    const compactPhone = to.trim().replace(/[\s()-]/g, '');
    const gatewayPhone = compactPhone.startsWith('+880')
      ? `0${compactPhone.slice(4)}`
      : compactPhone.startsWith('880')
        ? `0${compactPhone.slice(3)}`
        : compactPhone;
    const fields = {
      ...credentials,
      msisdn: gatewayPhone,
      message: `Your Nestt verification code is ${code}. It expires in 10 minutes.`,
      unicode: 'false',
    };
    for (const [name, value] of Object.entries(fields)) url.searchParams.set(name, value);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      });
      const rawBody = await response.text();
      let result: {
        success?: number | string;
        statuscode?: number | string;
        status?: Array<{ statuscode?: number | string }>;
      } = {};
      try {
        result = JSON.parse(rawBody) as typeof result;
      } catch {
        // Treat non-JSON provider responses as a declined delivery.
      }
      const accepted = response.ok && (
        ['1', '200', '202'].includes(String(result.success ?? result.statuscode)) ||
        result.status?.some((item) => String(item.statuscode) === '200') === true
      );
      if (!accepted) {
        throw new Error('SMS gateway declined the request');
      }
    } catch {
      throw new ServiceUnavailableException('SMS delivery is temporarily unavailable');
    }
  }
}
