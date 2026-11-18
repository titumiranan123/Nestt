import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
} from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type {
  CancelOrder,
  CreateAdminOrder,
  CreateOrder,
  CreateOrderRemark,
  ListOrders,
  QuoteOrder,
  PublicStorefrontCheckout,
  SubmitPublicCheckout,
  RequestReturn,
  DeliveryAreaInput,
  UpdateDeliveryAreaInput,
  DeliveryZoneConfigInput,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateReturnStatus,
} from './dto/order.schemas.js';
import { OrdersRepository } from './orders.repository.js';
import { CheckoutPhoneService } from './checkout-phone.service.js';
import { PaymentConfigService } from '../payments/payment-config.service.js';
import { AuthService } from '../auth/auth.service.js';
import { throwMappedPrismaError } from '../../common/utils/prisma-error.util.js';

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

const returnTransitions: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
  APPROVED: [ReturnStatus.RECEIVED, ReturnStatus.REJECTED],
  RECEIVED: [],
  REJECTED: [],
};

function checkoutOrderCode(userId: string, checkoutId: string) {
  const digest = createHash('sha256').update(`${userId}:${checkoutId}`).digest('hex');
  return `NST-W-${digest.slice(0, 24).toUpperCase()}`;
}

function checkoutFingerprint(input: CreateOrder) {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly checkoutPhone: CheckoutPhoneService,
    private readonly paymentConfig: PaymentConfigService,
    private readonly auth: AuthService,
  ) {}

  async requestCheckoutCode(userId: string, input: CreateOrder, ip: string) {
    await this.checkPaymentMethod(input);
    const quote = await this.repository.quoteCheckout(userId, {
      items: input.items, addressId: input.addressId, thanaId: input.shippingAddress?.thanaId,
    });
    if (input.expectedTotal === undefined || !quote.total.equals(input.expectedTotal)) {
      throw new ConflictException('The order total has changed. Review the updated amount and try again.');
    }
    const phone = await this.repository.checkoutPhone(userId, input);
    return this.checkoutPhone.request(userId, checkoutFingerprint(input) + ':' + phone, phone, ip);
  }

  quotePublic(input: QuoteOrder) {
    return this.repository.quoteCheckout(null, input);
  }

  async requestPublicCheckoutCode(input: PublicStorefrontCheckout, ip: string) {
    if (input.addressId || !input.shippingAddress) throw new BadRequestException('Enter a delivery address to continue');
    await this.checkPaymentMethod(input);
    const quote = await this.repository.quoteCheckout(null, {
      items: input.items,
      thanaId: input.shippingAddress.thanaId,
    });
    if (input.expectedTotal === undefined || !quote.total.equals(input.expectedTotal)) {
      throw new ConflictException('The order total has changed. Review the updated amount and try again.');
    }
    const phone = await this.repository.checkoutPhone(null, input);
    return this.checkoutPhone.request(undefined, checkoutFingerprint(input) + ':' + phone, phone, ip);
  }

  async completePublicCheckout(submit: SubmitPublicCheckout, ip = 'unknown') {
    const { code, ...input } = submit;
    if (!input.checkoutId || input.addressId || !input.shippingAddress) {
      throw new BadRequestException('Enter a delivery address to continue');
    }
    const fingerprint = checkoutFingerprint(input);
    if (!code) throw new BadRequestException('Enter the six-digit verification code');
    await this.checkPaymentMethod(input);
    const phone = await this.repository.checkoutPhone(null, input);
    await this.checkoutPhone.verify(undefined, fingerprint + ':' + phone, phone, code, ip);
    const customer = await this.auth.findOrCreateCheckoutCustomer(phone, input.shippingAddress.name);
    const userId = customer.id;
    const orderCode = checkoutOrderCode(userId, input.checkoutId);
    const existing = () => this.repository.findCheckout(userId, orderCode, fingerprint);
    let order = await existing();
    if (!order) {
      try {
        order = await this.repository.createCheckout(userId, orderCode, input, fingerprint, phone);
      } catch (error) {
        const committed = await existing();
        if (!committed) throw error;
        order = committed;
      }
    }
    const session = await this.auth.issueCheckoutSession(userId);
    return { id: order.id, orderCode: order.orderCode, session };
  }

  async create(userId: string, submit: CreateOrder & { code?: string }, ip = 'unknown') {
    const { code, ...input } = submit;
    if (input.checkoutId) {
      const orderCode = checkoutOrderCode(userId, input.checkoutId);
      const fingerprint = checkoutFingerprint(input);
      const existing = () => this.repository.findCheckout(userId, orderCode, fingerprint);
      const order = await existing();
      if (order) return this.getMine(userId, order.id);
      try {
        if (!code) throw new BadRequestException('Enter the six-digit verification code');
        await this.checkPaymentMethod(input);
        const phone = await this.repository.checkoutPhone(userId, input);
        await this.checkoutPhone.verify(userId, fingerprint + ':' + phone, phone, code, ip);
        return await this.repository.createCheckout(userId, orderCode, input, fingerprint, phone);
      } catch (error) {
        const committed = await existing();
        if (committed) return this.getMine(userId, committed.id);
        throw error;
      }
    }
    const orderCode = `NST-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    return this.repository.createCheckout(userId, orderCode, input);
  }

  private async checkPaymentMethod(input: CreateOrder) {
    if (input.paymentMethod === 'SSL_COMMERZ' && !(await this.paymentConfig.getSettings()).ssl?.status) {
      throw new ConflictException('Online payment is currently unavailable. Choose Cash on Delivery.');
    }
  }

  quote(userId: string, input: QuoteOrder) {
    return this.repository.quoteCheckout(userId, input);
  }

  async recoverCheckout(userId: string, checkoutId: string) {
    const order = await this.repository.findCheckout(userId, checkoutOrderCode(userId, checkoutId));
    return { id: order?.id ?? null };
  }

  listMine(userId: string, query: ListOrders) {
    return this.repository.listMine(userId, query);
  }

  async getMine(userId: string, id: string) {
    const order = await this.repository.findMine(userId, id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancelMine(userId: string, id: string, input: CancelOrder) {
    const order = await this.getMine(userId, id);
    if (order.payment?.method === 'SSL_COMMERZ' && order.paymentStatus === PaymentStatus.PENDING) {
      throw new ConflictException('Finish or cancel the payment on the gateway first.');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException(
        'Paid orders must be refunded before cancellation',
      );
    }
    return this.repository.cancelMine(userId, id, input.reason);
  }

  listAll(query: ListOrders) {
    return this.repository.listAll(query);
  }

  createAdmin(actorId: string, input: CreateAdminOrder) {
    const orderCode = `NST-POS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    return this.repository.createAdmin(orderCode, actorId, input);
  }

  async getById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, actorId: string, input: UpdateOrderStatus) {
    const order = await this.getById(id);
    if (order.orderSource === 'ONLINE' && order.payment?.method === 'SSL_COMMERZ' && order.paymentStatus === PaymentStatus.PENDING) {
      throw new ConflictException('Wait for the payment gateway to confirm the payment outcome.');
    }
    if (!allowedTransitions[order.status].includes(input.status)) {
      throw new ConflictException(
        `Order cannot move from ${order.status} to ${input.status}`,
      );
    }
    if (
      input.status === OrderStatus.CANCELLED &&
      order.paymentStatus === PaymentStatus.PAID
    ) {
      throw new ConflictException(
        'Paid orders must be refunded before cancellation',
      );
    }
    try {
      return await this.repository.updateStatus(id, actorId, input, order.version);
    } catch (error) {
      throwMappedPrismaError(error, {
        notFound: 'Order or payment record not found',
        unique: 'Duplicate order or payment reference',
      });
    }
  }

  async updatePaymentStatus(
    orderId: string,
    actorId: string,
    input: UpdatePaymentStatus,
  ) {
    const order = await this.getById(orderId);
    if (order.orderPhoneVerifiedAt && order.orderSource === 'ONLINE' && order.payment?.method === 'SSL_COMMERZ') {
      throw new ConflictException('SSLCommerz payments are updated by the gateway.');
    }
    if (
      order.paymentStatus === PaymentStatus.REFUNDED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new ConflictException(
        'Payment cannot be changed for a cancelled or refunded order',
      );
    }
    try {
      return await this.repository.updatePaymentStatus(orderId, actorId, input);
    } catch (error) {
      throwMappedPrismaError(error, {
        notFound: 'Order or payment record not found',
        unique: 'Duplicate order or payment reference',
      });
    }
  }

  addRemark(orderId: string, actorId: string, input: CreateOrderRemark) {
    return this.repository.addRemark(orderId, actorId, input);
  }

  requestReturn(userId: string, orderId: string, input: RequestReturn) {
    return this.repository.requestReturn(userId, orderId, input);
  }

  async updateReturnStatus(id: string, input: UpdateReturnStatus) {
    const record = await this.repository.findReturnById(id);
    if (!record) throw new NotFoundException('Return request not found');
    if (!returnTransitions[record.status].includes(input.status)) {
      throw new ConflictException(
        `Return cannot move from ${record.status} to ${input.status}`,
      );
    }
    try {
      const updated = await this.repository.updateReturnStatus(
        id,
        record.status,
        input,
      );
      if (updated.count !== 1)
        throw new ConflictException(
          'Return request changed; reload and try again',
        );
      return { id, status: input.status };
    } catch (error) {
      throwMappedPrismaError(error, {
        notFound: 'Order or payment record not found',
        unique: 'Duplicate order or payment reference',
      });
    }
  }

  listDeliveryAreas() {
    return this.repository.listDeliveryAreas();
  }

  saveDeliveryArea(input: DeliveryAreaInput) {
    return this.repository.saveDeliveryArea(input).catch((error: unknown) => {
      throwMappedPrismaError(error, {
        notFound: 'Order or payment record not found',
        unique: 'Duplicate order or payment reference',
      });
    });
  }

  updateDeliveryArea(thanaId: string, input: UpdateDeliveryAreaInput) {
    return this.repository.updateDeliveryArea(thanaId, input).catch((error: unknown) => {
      throwMappedPrismaError(error, {
        notFound: 'Delivery area not found',
        unique: 'A delivery area with this name already exists in the district',
      });
    });
  }

  deleteDeliveryArea(thanaId: string) {
    return this.repository.deleteDeliveryArea(thanaId).catch((error: unknown) => {
      throwMappedPrismaError(error, {
        notFound: 'Delivery area not found',
        unique: 'Delivery area could not be deleted',
      });
    });
  }

  listDeliveryZoneConfigs() {
    return this.repository.listDeliveryZoneConfigs();
  }

  saveDeliveryZoneConfig(input: DeliveryZoneConfigInput) {
    return this.repository
      .saveDeliveryZoneConfig(input)
      .catch((error: unknown) => {
        throwMappedPrismaError(error, {
          notFound: 'Order or payment record not found',
          unique: 'Duplicate order or payment reference',
        });
      });
  }
}
