import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { SmsService } from './sms.service.js';
import type { AppConfigService } from '../../config/app.config.js';

function makeSms() {
  const service = new SmsService({
    values: {
      TWILIO_ACCOUNT_SID: 'AC123456789',
      TWILIO_AUTH_TOKEN: 'test-token',
      TWILIO_FROM: '+15551234567',
    },
  } as AppConfigService);
  const create = vi.fn().mockResolvedValue({ sid: 'message-id' });
  (service as unknown as { client: { messages: { create: typeof create } } }).client = {
    messages: { create },
  };
  return { service, create };
}

describe('SmsService', () => {
  it('sends the configured verification message', async () => {
    const { service, create } = makeSms();
    await service.sendVerificationCode('+15557654321', '123456');
    expect(create).toHaveBeenCalledWith({
      from: '+15551234567',
      to: '+15557654321',
      body: 'Your Nestt verification code is 123456. It expires in 10 minutes.',
    });
  });

  it('maps provider failures to service unavailable', async () => {
    const { service, create } = makeSms();
    create.mockRejectedValueOnce(new Error('provider unavailable'));
    await expect(service.sendVerificationCode('+15557654321', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
