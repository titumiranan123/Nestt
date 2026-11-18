import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppConfigService } from '../../config/app.config.js';
import { PaymentConfigService } from '../payments/payment-config.service.js';
import { gatewayOrderResult, OrdersRepository, readGatewaySession, type GatewayOrder, type GatewayResult } from './orders.repository.js';

const callbackKinds = ['success', 'failed', 'cancelled', 'ipn'] as const;
type CallbackKind = typeof callbackKinds[number];
type GatewayRecord = Record<string, unknown>;
class GatewayRejectedSession extends Error {}

@Injectable()
export class SslCheckoutService {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly paymentConfig: PaymentConfigService,
    private readonly config: AppConfigService,
  ) {}

  async start(userId: string, id: string) {
    try {
      return await this.orders.startGatewaySession(id, userId, (order) => this.openSession(order));
    } catch (error) {
      if (!(error instanceof GatewayRejectedSession)) throw error;
      return { outcome: await this.orders.settleGatewayOrder(id, 'failed', undefined, true) };
    }
  }

  private async openSession(order: GatewayOrder) {
    if (!order.contactEmail) throw new BadRequestException('This order is missing its checkout email');
    const sandbox = this.config.values.SSL_COMMERZ_SANDBOX;
    const credentials = await this.credentials();
    const base = this.config.values.SSL_COMMERZ_CALLBACK_BASE_URL ?? this.config.values.APP_BASE_URL;
    const callback = (kind: CallbackKind) => {
      const url = new URL(`/api/payments/sslcommerz/${kind}`, base);
      url.searchParams.set('order', order.id);
      url.searchParams.set('state', this.sign(order.id, kind));
      return url.toString();
    };
    const body = new URLSearchParams({
      ...credentials,
      tran_id: order.orderCode,
      total_amount: order.totalAmount.toFixed(2),
      currency: 'BDT',
      success_url: callback('success'), fail_url: callback('failed'),
      cancel_url: callback('cancelled'), ipn_url: callback('ipn'),
      cus_name: order.shippingName, cus_email: order.contactEmail, cus_phone: order.shippingPhone,
      cus_add1: order.shippingAddress, cus_city: order.shippingCity, cus_state: order.shippingRegion,
      cus_postcode: order.shippingPostalCode || '0000', cus_country: 'Bangladesh',
      shipping_method: 'Courier',
      ship_name: order.shippingName, ship_add1: order.shippingAddress, ship_city: order.shippingCity,
      ship_state: order.shippingRegion, ship_postcode: order.shippingPostalCode || '0000', ship_country: 'Bangladesh',
      product_name: 'Nestt Furniture', product_category: 'Furniture', product_profile: 'general',
    });
    const session = await this.json(new URL('/gwprocess/v4/api.php', this.origin(sandbox)), { method: 'POST', body });
    if (session.status === 'FAILED' && !session.sessionkey) throw new GatewayRejectedSession();
    const gatewayUrl = typeof session.GatewayPageURL === 'string' ? session.GatewayPageURL : '';
    const sessionKey = typeof session.sessionkey === 'string' ? session.sessionkey : '';
    if (session.status !== 'SUCCESS' || !this.validRedirect(gatewayUrl) || !sessionKey || sessionKey.length > 100) {
      throw new ServiceUnavailableException('Could not open the SSLCommerz payment page');
    }
    return { gatewayUrl, sessionKey, sandbox };
  }

  async callback(id: string, kind: string, state: string, body: GatewayRecord) {
    if (!callbackKinds.includes(kind as CallbackKind) || typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state) ||
        !timingSafeEqual(Buffer.from(state, 'hex'), Buffer.from(this.sign(id, kind), 'hex'))) {
      throw new BadRequestException('Invalid payment callback');
    }
    const result = await this.check(id, undefined, body);
    return { id, outcome: result === 'pending' && (kind === 'cancelled' || kind === 'failed') ? kind : result };
  }

  async check(id: string, userId?: string, callback?: GatewayRecord): Promise<GatewayResult> {
    const { order, transaction } = await this.orders.findGatewayOrder(id, userId);
    if (callback?.tran_id && callback.tran_id !== order.orderCode) throw new BadRequestException('Invalid payment transaction');
    const current = gatewayOrderResult(order);
    if (current !== 'pending') return current;
    const session = readGatewaySession(transaction.metadata);
    if (!session) return 'pending';

    const validationId = typeof callback?.val_id === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(callback.val_id)
      ? callback.val_id : null;
    const path = validationId ? '/validator/api/validationserverAPI.php' : '/validator/api/merchantTransIDvalidationAPI.php';
    const url = new URL(path, this.origin(session.sandbox));
    url.search = new URLSearchParams({
      ...await this.credentials(true), format: 'json',
      ...(validationId ? { val_id: validationId } : { sessionkey: session.sessionKey }),
    }).toString();
    const result = await this.json(url);
    if (result.tran_id !== order.orderCode || (result.APIConnect && result.APIConnect !== 'DONE')) return 'pending';
    if (result.status === 'VALID' || result.status === 'VALIDATED') {
      const reference = this.paidReference(order, result);
      return reference ? this.orders.settleGatewayOrder(id, 'success', reference) : 'pending';
    }
    if (result.status === 'FAILED' || result.status === 'EXPIRED' || result.status === 'CANCELLED') {
      return this.orders.settleGatewayOrder(id, result.status === 'CANCELLED' || callback?.status === 'CANCELLED' ? 'cancelled' : 'failed');
    }
    return 'pending';
  }

  private paidReference(order: GatewayOrder, result: GatewayRecord) {
    const currency = result.currency_type ?? result.currency;
    const amount = String(result.currency_amount || result.amount || '');
    const reference = result.bank_tran_id;
    if (currency !== 'BDT' || !/^\d{1,12}(\.\d{1,2})?$/.test(amount) || !order.totalAmount.equals(amount) ||
        String(result.risk_level) !== '0' || typeof reference !== 'string' || !reference.trim() || reference.length > 100) return null;
    return reference;
  }

  private async credentials(allowDisabled = false) {
    const { storeId, storePass } = await this.paymentConfig.getGatewayCredentials('SSL_COMMERZ', allowDisabled);
    return { store_id: storeId, store_passwd: storePass };
  }

  private origin(sandbox: boolean) {
    return sandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
  }

  private sign(id: string, kind: string) {
    return createHmac('sha256', this.config.values.PAYMENT_CONFIG_ENCRYPTION_KEY)
      .update(`sslcommerz-callback:${id}:${kind}`).digest('hex');
  }

  private validRedirect(url: string) {
    try {
      const target = new URL(url);
      return target.protocol === 'https:' && target.hostname.endsWith('.sslcommerz.com') && !target.username && !target.password;
    } catch { return false; }
  }

  private async json(url: URL, init?: RequestInit): Promise<GatewayRecord> {
    try {
      const response = await fetch(url, {
        ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(7_000),
      });
      if (!response.ok) throw new Error('Gateway unavailable');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Unexpected gateway response');
      return data as GatewayRecord;
    } catch {
      throw new ServiceUnavailableException('SSLCommerz could not confirm this payment. Try again shortly.');
    }
  }
}
