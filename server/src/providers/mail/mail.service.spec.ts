import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MailService } from './mail.service.js';
import type { AppConfigService } from '../../config/app.config.js';

function makeMailer() {
  const service = new MailService({
    values: {
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: 587,
      SMTP_USER: 'user',
      SMTP_PASSWORD: 'password',
      MAIL_FROM: 'Nestt <noreply@example.com>',
    },
  } as AppConfigService);
  const mailer = { sendMail: vi.fn().mockResolvedValue(undefined) };
  (service as unknown as { mailer: typeof mailer }).mailer = mailer;
  return { service, mailer };
}

describe('MailService', () => {
  it('sends verification messages with and without a link', async () => {
    const { service, mailer } = makeMailer();
    await service.sendVerificationEmail('user@example.com', 'Verify', '123456', 'https://example.com/verify');
    expect(mailer.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
      from: 'Nestt <noreply@example.com>',
      to: 'user@example.com',
      subject: 'Verify',
      text: expect.stringContaining('Or use this link: https://example.com/verify'),
    }));
    await service.sendVerificationEmail('user@example.com', 'Reset', '654321');
    expect(mailer.sendMail).toHaveBeenLastCalledWith(expect.objectContaining({
      text: expect.not.stringContaining('Or use this link'),
    }));
  });

  it('maps provider failures to service unavailable', async () => {
    const { service, mailer } = makeMailer();
    mailer.sendMail.mockRejectedValueOnce(new Error('smtp unavailable'));
    await expect(service.sendVerificationEmail('user@example.com', 'Verify', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
