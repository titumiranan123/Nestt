import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  ReturnStatus,
} from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { createOrderSchema } from './dto/order.schemas.js';
import { OrdersRepository } from './orders.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const variantId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';

function checkoutInput() {
  return createOrderSchema.parse({
    items: [{ variantId, quantity: 2 }],
    shippingAddress: {
      name: 'Customer',
      phone: '+8801712345678',
      region: 'Dhaka',
      city: 'Dhaka',
      area: 'Gulshan',
      address: 'House 10',
      postalCode: '1212',
    },
  });
}

function transactionDb(tx: Record<string, unknown>) {
  return {
    $transaction: vi.fn((callback: (client: unknown) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
}

function sampleVariant() {
  return {
    id: variantId,
    name: 'Walnut finish',
    sku: 'CHAIR-WALNUT',
    price: new Prisma.Decimal('1250.50'),
    stockQuantity: 5,
    image: null,
    product: { name: 'Dining chair', isPublished: true },
  };
}

describe('OrdersRepository checkout', () => {
  it('prices from database records, reserves inventory, and creates order history and COD payment atomically', async () => {
    const variant = sampleVariant();
    const tx = {
      productVariant: {
        findMany: vi.fn().mockResolvedValue([variant]),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: variantId }]),
      address: { findFirst: vi.fn() },
      shippingRate: {
        findUnique: vi.fn().mockResolvedValue({
          charge: new Prisma.Decimal('150.00'),
          isActive: true,
        }),
      },
      order: {
        create: vi.fn().mockResolvedValue({
          id: 'order-1',
          totalAmount: new Prisma.Decimal('2651.00'),
        }),
      },
    };
    const repository = new OrdersRepository(transactionDb(tx));

    await expect(
      repository.createCheckout(userId, 'NST-TEST', checkoutInput()),
    ).resolves.toMatchObject({ id: 'order-1' });
    expect(tx.productVariant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: { in: [variantId] },
          isPublished: true,
          product: { isPublished: true },
        },
      }),
    );
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(tx.$queryRaw.mock.calls[0][0].sql).toContain(
      '"stockQuantity" >= requested.quantity',
    );
    expect(tx.$queryRaw.mock.calls[0][0].sql).toContain(
      '"stockQuantity" - requested.quantity',
    );
    const create = tx.order.create.mock.calls[0][0];
    expect(create.data).toMatchObject({
      orderCode: 'NST-TEST',
      userId,
      subTotal: new Prisma.Decimal('2501.00'),
      shippingCharge: new Prisma.Decimal('150.00'),
      totalAmount: new Prisma.Decimal('2651.00'),
      paymentStatus: PaymentStatus.UNPAID,
      items: {
        create: [
          {
            productName: 'Dining chair',
            variantName: 'Walnut finish',
            quantity: 2,
            unitPrice: new Prisma.Decimal('1250.50'),
            totalPrice: new Prisma.Decimal('2501.00'),
          },
        ],
      },
      payments: {
        create: {
          method: 'CASH_ON_DELIVERY',
          status: PaymentStatus.UNPAID,
          amount: new Prisma.Decimal('2651.00'),
          currency: 'BDT',
        },
      },
      statusHistories: {
        create: {
          status: OrderStatus.PENDING,
          changedBy: userId,
          isPublic: true,
        },
      },
    });
  });

  it('uses a saved address only for its owner and refuses unavailable products or areas', async () => {
    const tx = {
      productVariant: {
        findMany: vi.fn().mockResolvedValue([sampleVariant()]),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: variantId }]),
      address: { findFirst: vi.fn().mockResolvedValue(null) },
      shippingRate: { findUnique: vi.fn() },
      order: { create: vi.fn().mockResolvedValue({ id: 'order-2' }) },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    const input = createOrderSchema.parse({
      items: [{ variantId, quantity: 1 }],
      addressId: '44444444-4444-4444-8444-444444444444',
    });
    await expect(
      repository.createCheckout(userId, 'NST-1', input),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.address.findFirst).toHaveBeenCalledWith({
      where: { id: input.addressId, userId },
    });

    tx.address.findFirst.mockResolvedValue({
      fullName: 'Customer',
      phone: '+8801712345678',
      region: 'Dhaka',
      city: 'Dhaka',
      area: 'Gulshan',
      addressLine: 'House',
      postalCode: null,
    });
    tx.shippingRate.findUnique.mockResolvedValue({
      isActive: false,
      charge: new Prisma.Decimal(100),
    });
    await expect(
      repository.createCheckout(userId, 'NST-2', input),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.shippingRate.findUnique.mockResolvedValue({
      isActive: true,
      charge: new Prisma.Decimal(100),
    });
    await repository.createCheckout(userId, 'NST-2-SAVED', input);
    expect(tx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shippingName: 'Customer',
          shippingAddress: 'House',
        }),
      }),
    );
    tx.productVariant.findMany.mockResolvedValue([]);
    await expect(
      repository.createCheckout(userId, 'NST-3', input),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rolls back checkout when stock changes before reservation', async () => {
    const tx = {
      productVariant: {
        findMany: vi.fn().mockResolvedValue([sampleVariant()]),
      },
      $queryRaw: vi.fn().mockResolvedValue([]),
      address: { findFirst: vi.fn() },
      shippingRate: {
        findUnique: vi
          .fn()
          .mockResolvedValue({ isActive: true, charge: new Prisma.Decimal(0) }),
      },
      order: { create: vi.fn() },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    await expect(
      repository.createCheckout(userId, 'NST-4', checkoutInput()),
    ).rejects.toThrow('Insufficient stock');
    expect(tx.order.create).not.toHaveBeenCalled();
  });
});

describe('OrdersRepository order lifecycle', () => {
  it('lists the customer order page and returns only public history for a customer detail', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'order-1' }]);
    const count = vi.fn().mockResolvedValue(1);
    const findFirst = vi.fn().mockResolvedValue({ id: 'order-1' });
    const db = {
      $transaction: vi.fn((operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
      order: { findMany, count, findFirst },
    } as unknown as PrismaService;
    const repository = new OrdersRepository(db);
    await expect(
      repository.listMine(userId, { page: 2, pageSize: 10 } as never),
    ).resolves.toMatchObject({ total: 1, page: 2 });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId }, skip: 10, take: 10 }),
    );
    await repository.findMine(userId, 'order-1');
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1', userId },
        include: expect.objectContaining({
          statusHistories: {
            where: { isPublic: true },
            orderBy: { createdAt: 'asc' },
          },
        }),
      }),
    );
  });

  it('cancels eligible orders, releases only reserved stock, and records status history', async () => {
    const tx = {
      order: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'order-1',
          userId,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.UNPAID,
          version: 3,
          items: [
            { id: itemId, variantId, quantity: 2, stockReserved: true },
            {
              id: '44444444-4444-4444-8444-444444444444',
              variantId,
              quantity: 1,
              stockReserved: false,
            },
            {
              id: '55555555-5555-4555-8555-555555555555',
              variantId: null,
              quantity: 1,
              stockReserved: true,
            },
          ],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'order-1', status: OrderStatus.CANCELLED }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: variantId }]),
      orderItem: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    await expect(
      repository.cancelMine(userId, 'order-1', 'Customer request'),
    ).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
    expect(tx.$queryRaw.mock.calls[0][0].sql).toContain(
      '"stockQuantity" + reserved.quantity',
    );
    expect(tx.orderItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: [itemId] }, stockReserved: true },
      data: { stockReserved: false },
    });
    expect(tx.orderStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: OrderStatus.CANCELLED,
        changedBy: userId,
        note: 'Customer request',
      }),
    });
  });

  it('rejects missing, paid, completed, and concurrently changed cancellations', async () => {
    const tx = {
      order: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          version: 1,
          items: [],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    tx.order.findFirst.mockResolvedValueOnce(null);
    await expect(
      repository.cancelMine(userId, 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
    tx.order.findFirst.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.UNPAID,
      version: 1,
      items: [],
    });
    await expect(
      repository.cancelMine(userId, 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.order.findFirst.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PAID,
      version: 1,
      items: [],
    });
    await expect(
      repository.cancelMine(userId, 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.order.findFirst.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      version: 1,
      items: [],
    });
    await expect(
      repository.cancelMine(userId, 'order-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists admin orders and performs versioned status changes with stock release on cancellation', async () => {
    const tx = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.PROCESSING,
          version: 4,
          items: [{ id: itemId, variantId, quantity: 1, stockReserved: true }],
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ id: variantId }]),
      orderItem: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      orderStatusHistory: { create: vi.fn().mockResolvedValue({}) },
    };
    const db = {
      $transaction: vi.fn((callback: (client: unknown) => unknown) =>
        callback(tx),
      ),
      order: { findUnique: vi.fn().mockResolvedValue({ id: 'order-1' }) },
    } as unknown as PrismaService;
    const repository = new OrdersRepository(db);
    await expect(
      repository.listAll({ page: 1, pageSize: 20 } as never),
    ).resolves.toMatchObject({ total: 0 });
    await repository.findById('order-1');
    await expect(
      repository.updateStatus('order-1', userId, {
        status: 'CANCELLED',
        isPublic: true,
      }),
    ).resolves.toMatchObject({ id: 'order-1' });
    expect(tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: OrderStatus.PROCESSING, version: 4 },
      data: { status: 'CANCELLED', version: { increment: 1 } },
    });
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
  });

  it('records COD payment results and admin remarks, and handles payment races', async () => {
    const tx = {
      payment: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'payment-1',
          status: PaymentStatus.UNPAID,
          amount: new Prisma.Decimal(100),
          currency: 'BDT',
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        findUnique: vi
          .fn()
          .mockResolvedValue({ id: 'payment-1', status: PaymentStatus.PAID }),
      },
      order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      transaction: {
        create: vi.fn().mockResolvedValue({ id: 'transaction-1' }),
      },
    };
    const db = {
      $transaction: vi.fn((callback: (client: unknown) => unknown) =>
        callback(tx),
      ),
      orderRemark: { create: vi.fn().mockResolvedValue({ id: 'remark-1' }) },
    } as unknown as PrismaService;
    const repository = new OrdersRepository(db);
    await expect(
      repository.updatePaymentStatus('order-1', userId, {
        status: 'PAID',
        reference: 'cash-receipt-1',
      }),
    ).resolves.toMatchObject({ status: PaymentStatus.PAID });
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: 'SUCCESS',
        amount: new Prisma.Decimal(100),
        gatewayTransactionId: 'cash-receipt-1',
        metadata: { source: 'admin', actorId: userId },
      }),
    });
    await expect(
      repository.addRemark('order-1', userId, {
        note: 'Called customer',
        isInternal: true,
      }),
    ).resolves.toMatchObject({ id: 'remark-1' });
    tx.payment.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      repository.updatePaymentStatus('order-1', userId, { status: 'FAILED' }),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.order.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      repository.updatePaymentStatus('order-1', userId, { status: 'FAILED' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.transaction.create).toHaveBeenCalledTimes(1);
  });

  it('refuses missing or already-paid payment records', async () => {
    const payment = {
      id: 'payment-1',
      status: PaymentStatus.UNPAID,
      amount: new Prisma.Decimal(100),
      currency: 'BDT',
    };
    const tx = {
      payment: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ ...payment, status: PaymentStatus.PAID }),
      },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    await expect(
      repository.updatePaymentStatus('order-1', userId, { status: 'PAID' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      repository.updatePaymentStatus('order-1', userId, { status: 'PAID' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates customer return requests only for delivered orders and prevents duplicates', async () => {
    const tx = {
      order: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'order-1',
          status: OrderStatus.DELIVERED,
          items: [{ id: itemId }],
        }),
      },
      orderReturn: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'return-1',
          status: ReturnStatus.REQUESTED,
        }),
      },
    };
    const repository = new OrdersRepository(transactionDb(tx));
    await expect(
      repository.requestReturn(userId, 'order-1', {
        itemId,
        reason: 'Damaged',
      }),
    ).resolves.toMatchObject({ id: 'return-1' });
    tx.order.findFirst.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.PROCESSING,
      items: [{ id: itemId }],
    });
    await expect(
      repository.requestReturn(userId, 'order-1', { itemId }),
    ).rejects.toBeInstanceOf(ConflictException);
    tx.order.findFirst.mockResolvedValueOnce({
      id: 'order-1',
      status: OrderStatus.DELIVERED,
      items: [{ id: itemId }],
    });
    tx.orderReturn.findFirst.mockResolvedValueOnce({ id: 'return-1' });
    await expect(
      repository.requestReturn(userId, 'order-1', { itemId }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects returns for missing orders or items and manages return/shipping records', async () => {
    const tx = {
      order: {
        findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          id: 'order-1',
          status: OrderStatus.DELIVERED,
          items: [],
        }),
      },
      orderReturn: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        findUnique: vi.fn().mockResolvedValue({ id: 'return-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const db = {
      $transaction: vi.fn((callback: (client: unknown) => unknown) =>
        callback(tx),
      ),
      orderReturn: {
        findUnique: vi.fn().mockResolvedValue({ id: 'return-1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      shippingRate: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi
          .fn()
          .mockResolvedValue({ charge: new Prisma.Decimal('50.00') }),
      },
    } as unknown as PrismaService;
    const repository = new OrdersRepository(db);
    await expect(
      repository.requestReturn(userId, 'missing', { itemId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      repository.requestReturn(userId, 'order-1', { itemId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(repository.findReturnById('return-1')).resolves.toMatchObject({
      id: 'return-1',
    });
    await expect(
      repository.updateReturnStatus('return-1', ReturnStatus.REQUESTED, {
        status: 'APPROVED',
      }),
    ).resolves.toMatchObject({ count: 1 });
    await expect(repository.listShippingRates()).resolves.toEqual([]);
    await expect(
      repository.saveShippingRate({
        region: 'Dhaka',
        city: 'Dhaka',
        area: 'Gulshan',
        charge: '50.00',
        isActive: true,
      }),
    ).resolves.toMatchObject({ charge: new Prisma.Decimal('50.00') });
  });
});
