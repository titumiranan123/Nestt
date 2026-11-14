import { ChallengePurpose } from '@prisma/client';
import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OtpService } from './otp.service.js';
import type { AuthRepository } from '../auth.repository.js';
import type { AuthCrypto } from './auth-crypto.service.js';
import type { MailService } from '../../../providers/mail/mail.service.js';
import type { SmsService } from '../../../providers/sms/sms.service.js';
import type { AppConfigService } from '../../../config/app.config.js';

describe('OtpService delivery handling', () => {
  function setup() {
    const repo = {
      hitLimit: vi.fn(async () => true),
      issueChallenge: vi.fn(async () => ({ id: 'challenge-id' })),
      deleteChallenge: vi.fn(async () => ({ count: 1 })),
    };
    const crypto = {
      newCode: vi.fn(() => '123456'),
      codeHash: vi.fn(() => 'hashed-code'),
      tokenHash: vi.fn((value: string) => `hash:${value}`),
    };
    const mail = { sendVerificationEmail: vi.fn(async () => {}) };
    const sms = { sendVerificationCode: vi.fn(async () => {}) };
    const config = { values: { APP_BASE_URL: 'https://nestt.example' } };
    const service = new OtpService(
      repo as unknown as AuthRepository,
      crypto as unknown as AuthCrypto,
      mail as unknown as MailService,
      sms as unknown as SmsService,
      config as AppConfigService,
    );
    return { service, repo, crypto, mail, sms };
  }

  it('hashes codes and enforces separate target and IP limits', async () => {
    const { service, crypto, repo } = setup();
    expect(service.hash(ChallengePurpose.VERIFY_EMAIL, 'user@example.com', '123456')).toBe('hashed-code');
    await service.enforceLimit('login', 'user@example.com', '127.0.0.1');
    expect(repo.hitLimit).toHaveBeenNthCalledWith(1, 'target:hash:login:user@example.com', 5, 3600);
    expect(repo.hitLimit).toHaveBeenNthCalledWith(2, 'ip:hash:login:ip:127.0.0.1', 40, 3600);
    await service.enforceLimit('verify', 'target', 'ip', true);
    expect(repo.hitLimit).toHaveBeenNthCalledWith(3, 'target:hash:verify:target', 10, 600);
    expect(repo.hitLimit).toHaveBeenNthCalledWith(4, 'ip:hash:verify:ip:ip', 30, 3600);
    expect(crypto.tokenHash).toHaveBeenCalledTimes(4);
  });

  it('rejects a request when either rate limit is exceeded', async () => {
    const { service, repo } = setup();
    repo.hitLimit.mockResolvedValueOnce(false);
    await expect(service.enforceLimit('login', 'target', 'ip')).rejects.toMatchObject({ status: 429 });
    repo.hitLimit.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await expect(service.enforceLimit('login', 'target', 'ip')).rejects.toMatchObject({ status: 429 });
  });

  it('sends SMS for both phone challenge purposes', async () => {
    const { service, repo, sms, crypto } = setup();
    await service.sendChallenge(ChallengePurpose.PHONE_LOGIN, '+15551234567');
    await service.sendChallenge(ChallengePurpose.LINK_PHONE, '+15551234567', 'user-id');
    expect(repo.issueChallenge).toHaveBeenNthCalledWith(1, ChallengePurpose.PHONE_LOGIN, '+15551234567', 'hashed-code', undefined);
    expect(sms.sendVerificationCode).toHaveBeenNthCalledWith(1, '+15551234567', '123456');
    expect(sms.sendVerificationCode).toHaveBeenCalledTimes(2);
    expect(crypto.newCode).toHaveBeenCalledTimes(2);
  });

  it('sends email verification links for verify and link purposes', async () => {
    const { service, mail } = setup();
    await service.sendChallenge(ChallengePurpose.VERIFY_EMAIL, 'a+b@example.com');
    await service.sendChallenge(ChallengePurpose.LINK_EMAIL, 'user@example.com', 'user-id');
    expect(mail.sendVerificationEmail).toHaveBeenNthCalledWith(
      1,
      'a+b@example.com',
      'Verify your Nestt email',
      '123456',
      'https://nestt.example/verify-email?email=a%2Bb%40example.com&code=123456',
    );
    expect(mail.sendVerificationEmail).toHaveBeenNthCalledWith(
      2,
      'user@example.com',
      'Verify your Nestt email',
      '123456',
      'https://nestt.example/verify-email?email=user%40example.com&code=123456',
    );
  });

  it('sends password reset email without a verification link', async () => {
    const { service, mail } = setup();
    await service.sendChallenge(ChallengePurpose.RESET_PASSWORD, 'user@example.com');
    expect(mail.sendVerificationEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Reset your Nestt password',
      '123456',
      undefined,
    );
  });

  it('removes the challenge record if SMS delivery fails', async () => {
    const repo = {
      issueChallenge: vi.fn(async () => ({ id: 'challenge-id' })),
      deleteChallenge: vi.fn(async () => ({ count: 1 })),
    };
    const crypto = {
      newCode: () => '123456',
      codeHash: () => 'hashed-code',
    };
    const sms = {
      sendVerificationCode: vi.fn(async () => {
        throw new Error('provider outage');
      }),
    };
    const otp = new OtpService(
      repo as unknown as AuthRepository,
      crypto as unknown as AuthCrypto,
      {} as MailService,
      sms as unknown as SmsService,
      { values: { APP_BASE_URL: 'https://example.com' } } as AppConfigService,
    );

    await expect(
      otp.sendChallenge(ChallengePurpose.PHONE_LOGIN, '+8801712345678'),
    ).rejects.toThrow('provider outage');
    expect(repo.deleteChallenge).toHaveBeenCalledWith('challenge-id');
  });

  it('removes email challenge after delivery fails and identifies public mail errors', async () => {
    const { service, repo, mail } = setup();
    mail.sendVerificationEmail.mockRejectedValueOnce(new Error('mail outage'));
    await expect(service.sendChallenge(ChallengePurpose.RESET_PASSWORD, 'user@example.com')).rejects.toThrow('mail outage');
    expect(repo.deleteChallenge).toHaveBeenCalledWith('challenge-id');
    expect(service.isPublicMailFailure(new ServiceUnavailableException())).toBe(true);
    expect(service.isPublicMailFailure(new Error('other'))).toBe(false);
  });
});
