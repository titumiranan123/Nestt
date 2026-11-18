import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfigService } from '../../config/app.config.js';
import type { RedisAuthStore } from '../auth/redis-auth-store.service.js';
import type { OtpService } from '../auth/services/otp.service.js';
import type { PaymentConfigService } from '../payments/payment-config.service.js';
import { CheckoutPhoneService } from './checkout-phone.service.js';
import type { GatewayOrder, OrdersRepository } from './orders.repository.js';
import { SslCheckoutService } from './ssl-checkout.service.js';

describe('Checkout phone OTP', () => {
  it('scopes OTP to the checkout payload and customer and enforces resend cooldown', async () => {
    const otp = { assertPhoneDelivery: vi.fn(), enforceLimit: vi.fn(), sendChallenge: vi.fn(), hash: vi.fn(() => 'hash') };
    const redis = { hitLimit: vi.fn().mockResolvedValue(true), consumeChallenge: vi.fn().mockResolvedValue(null) };
    const service = new CheckoutPhoneService(otp as unknown as OtpService, redis as unknown as RedisAuthStore);
    const phone = '+8801712345678';
    await expect(service.request('buyer', 'fingerprint', phone, 'local')).resolves.toEqual({ phoneEnding: '5678' });
    expect(otp.sendChallenge).toHaveBeenCalledWith('CHECKOUT_PHONE', 'fingerprint', 'buyer', phone);
    redis.hitLimit.mockResolvedValueOnce(false);
    await expect(service.request('buyer', 'fingerprint', phone, 'local')).rejects.toThrow('Wait 45 seconds');
    await expect(service.verify('buyer', 'other-fingerprint', phone, '123456', 'local')).rejects.toThrow('Invalid or expired');
    redis.consumeChallenge.mockResolvedValueOnce({ id: 'issued' });
    await service.verify('buyer', 'fingerprint', phone, '123456', 'local');
    expect(redis.consumeChallenge).toHaveBeenLastCalledWith('CHECKOUT_PHONE', 'fingerprint', 'hash', 'buyer');
  });
});

const key = 'test-key';
const id = '48cf8584-cadc-45bd-982a-79c7928fd243';
const orderCode = 'NST-W-TEST';
const gatewayUrl = 'https://sandbox.sslcommerz.com/EasyCheckOut/test';
const order = {
  id, orderCode, totalAmount: new Prisma.Decimal('26120.00'), paymentStatus: 'PENDING',
  shippingName: 'QA Customer', contactEmail: 'buyer@example.test', shippingPhone: '+8801712345678',
  shippingAddress: 'Test address', shippingCity: 'Dhaka', shippingRegion: 'Dhaka',
} as GatewayOrder;

function setupGateway() {
  const transaction = { metadata: { gatewayUrl, sessionKey: 'session-1', sandbox: true } };
  const orders = {
    findGatewayOrder: vi.fn().mockResolvedValue({ order, transaction }),
    settleGatewayOrder: vi.fn(async (_id, outcome: string) => outcome),
    startGatewaySession: vi.fn(async (_id, _user, start) => start(order)),
  };
  const config = { values: { PAYMENT_CONFIG_ENCRYPTION_KEY: key, SSL_COMMERZ_SANDBOX: true, APP_BASE_URL: 'https://store.example.test' } };
  const settings = { getGatewayCredentials: vi.fn().mockResolvedValue({ storeId: 'fixture-id', storePass: 'fixture-pass' }) };
  const gateway = new SslCheckoutService(orders as unknown as OrdersRepository, settings as unknown as PaymentConfigService, config as AppConfigService);
  const sign = (kind: string) => createHmac('sha256', key).update(`sslcommerz-callback:${id}:${kind}`).digest('hex');
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  return { gateway, orders, sign, fetcher };
}

describe('SSLCommerz checkout', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates a hosted session using the server total and signed callbacks', async () => {
    const { gateway, fetcher, sign } = setupGateway();
    fetcher.mockResolvedValueOnce(Response.json({ status: 'SUCCESS', GatewayPageURL: gatewayUrl, sessionkey: 'session-1' }));
    await expect(gateway.start('buyer', id)).resolves.toMatchObject({ gatewayUrl });
    const [url, request] = fetcher.mock.calls[0] as [URL, RequestInit];
    const body = request.body as URLSearchParams;
    expect(url.pathname).toBe('/gwprocess/v4/api.php');
    expect(body.get('total_amount')).toBe('26120.00');
    expect(body.get('currency')).toBe('BDT');
    expect(body.get('success_url')).toContain(sign('success'));
    expect(body.get('cancel_url')).toContain(sign('cancelled'));
    expect(body.get('ipn_url')).toContain(sign('ipn'));
  });

  it('marks paid only after validating the amount, BDT, and transaction', async () => {
    const { gateway, orders, sign, fetcher } = setupGateway();
    const verified = { status: 'VALID', tran_id: orderCode, currency: 'BDT', amount: '26120.00', risk_level: 0, bank_tran_id: 'bank-ref' };
    const body = { tran_id: orderCode, val_id: 'validation-1', status: 'VALID' };
    for (const mismatch of [{ amount: '1.00' }, { tran_id: 'another-order' }, { risk_level: 1 }]) {
      fetcher.mockResolvedValueOnce(Response.json({ ...verified, ...mismatch }));
      await expect(gateway.callback(id, 'success', sign('success'), body)).resolves.toMatchObject({ outcome: 'pending' });
    }
    expect(orders.settleGatewayOrder).not.toHaveBeenCalled();
    fetcher.mockResolvedValueOnce(Response.json(verified));
    await expect(gateway.callback(id, 'success', sign('success'), body)).resolves.toMatchObject({ outcome: 'success' });
    expect(orders.settleGatewayOrder).toHaveBeenCalledWith(id, 'success', 'bank-ref');
  });

  it('discards invalid signatures and settles confirmed cancellation or failure', async () => {
    const { gateway, orders, sign, fetcher } = setupGateway();
    await expect(gateway.callback(id, 'success', sign('failed'), {})).rejects.toThrow('Invalid payment callback');
    expect(fetcher).not.toHaveBeenCalled();
    for (const [kind, status] of [['cancelled', 'CANCELLED'], ['failed', 'FAILED']]) {
      fetcher.mockResolvedValueOnce(Response.json({ APIConnect: 'DONE', status, tran_id: orderCode }));
      await expect(gateway.callback(id, kind, sign(kind), {})).resolves.toMatchObject({ outcome: kind });
      expect(orders.settleGatewayOrder).toHaveBeenLastCalledWith(id, kind);
    }
  });
});
