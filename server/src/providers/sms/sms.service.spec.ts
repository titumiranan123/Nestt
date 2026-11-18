import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SmsService } from './sms.service.js';
import type { AppConfigService } from '../../config/app.config.js';

const testUrl = 'https://sms.example.test/postman/api/sendsms';

function makeSms(url = testUrl, nodeEnv: 'development' | 'test' | 'production' = 'test') {
  return new SmsService({
    values: {
      NODE_ENV: nodeEnv,
      SMS_API_URL: url,
      SMS_USERID: 'nestt-test',
      SMS_PASSWORD: 'test-secret',
      SMS_ACCOUNT_ID: 'test-account',
      SMS_MASKING: 'Nestt',
    },
  } as AppConfigService);
}

afterEach(() => vi.unstubAllGlobals());

describe('SmsService', () => {
  it('requests delivery from the configured SMS gateway', async () => {
    const send = vi.fn().mockResolvedValue(Response.json({
      success: 1,
      status: [{ statuscode: 200, msg: 'message-1' }],
    }));
    vi.stubGlobal('fetch', send);
    await makeSms().sendVerificationCode('+8801700000000', '123456');
    const [url, options] = send.mock.calls[0] as [URL, RequestInit];
    expect(url.origin + url.pathname).toBe(testUrl);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      userid: 'nestt-test',
      password: 'test-secret',
      masking: 'Nestt',
      msisdn: '01700000000',
      message: 'Your Nestt verification code is 123456. It expires in 10 minutes.',
      unicode: 'false',
    });
    expect(options.redirect).toBe('error');
  });

  it('accepts the gateway accepted status returned for queued SMS requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ statuscode: '202' })));
    await expect(makeSms().sendVerificationCode('+8801700000000', '123456')).resolves.toBeUndefined();
  });

  it('handles a gateway rejection even when HTTP status is 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ statuscode: '204' })));
    await expect(makeSms().sendVerificationCode('+8801700000000', '123456')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('keeps credentials and verification codes off insecure connections', async () => {
    const send = vi.fn();
    vi.stubGlobal('fetch', send);
    await expect(makeSms(testUrl.replace('https:', 'http:')).sendVerificationCode('+8801700000000', '123456'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(send).not.toHaveBeenCalled();
  });

  it('allows the explicitly configured HTTP gateway in development only', async () => {
    const send = vi.fn().mockResolvedValue(Response.json({ statuscode: '202' }));
    vi.stubGlobal('fetch', send);
    const developmentSms = makeSms(testUrl.replace('https:', 'http:'), 'development');
    await expect(developmentSms.sendVerificationCode('+8801700000000', '123456')).resolves.toBeUndefined();

    const productionSms = makeSms(testUrl.replace('https:', 'http:'), 'production');
    await expect(productionSms.sendVerificationCode('+8801700000000', '123456'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
