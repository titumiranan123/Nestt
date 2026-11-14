import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
} from '@prisma/client';
import { randomBytes } from 'node:crypto';
import type {
  CancelOrder,
  CreateOrder,
  CreateOrderRemark,
  ListOrders,
  RequestReturn,
  DeliveryAreaInput,
  DeliveryZoneConfigInput,
  UpdateOrderStatus,
  UpdatePaymentStatus,
  UpdateReturnStatus,
} from './dto/order.schemas.js';
import { OrdersRepository } from './orders.repository.js';
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

@Injectable()
export class OrdersService {
  constructor(private readonly repository: OrdersRepository) {}

  create(userId: string, input: CreateOrder) {
    const orderCode = `NST-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
    return this.repository.createCheckout(userId, orderCode, input);
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

  async getById(id: string) {
    const order = await this.repository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, actorId: string, input: UpdateOrderStatus) {
    const order = await this.getById(id);
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
      return await this.repository.updateStatus(id, actorId, input);
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
