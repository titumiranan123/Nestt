import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma, ReturnStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { OrdersRepository } from './orders.repository.js';
import { OrdersService } from './orders.service.js';

function setup() {
  const repository = {
    createCheckout: vi.fn(), listMine: vi.fn(), findMine: vi.fn(), cancelMine: vi.fn(),
    listAll: vi.fn(), findById: vi.fn(), updateStatus: vi.fn(), updatePaymentStatus: vi.fn(),
    addRemark: vi.fn(), requestReturn: vi.fn(), updateReturnStatus: vi.fn(), findReturnById: vi.fn(),
    listShippingRates: vi.fn(), saveShippingRate: vi.fn(),
  };
  return { repository, service: new OrdersService(repository as unknown as OrdersRepository) };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

describe('OrdersService', () => {
  it('creates an order using a server-generated order code', async () => {
    const { repository, service } = setup();
    repository.createCheckout.mockResolvedValue({ orderCode: 'NST-ORDER' });
    const input = { items: [], billingSameAsShipping: true } as never;
    await expect(service.create('user-1', input)).resolves.toMatchObject({ orderCode: 'NST-ORDER' });
    expect(repository.createCheckout).toHaveBeenCalledWith('user-1', expect.stringMatching(/^NST-[A-Z0-9]+-[A-F0-9]+$/), input);
  });

  it('delegates customer lists, returns owned orders, and hides orders not owned by the user', async () => {
    const { repository, service } = setup();
    const page = { page: 1, pageSize: 20 } as never;
    repository.listMine.mockResolvedValue({ items: [], total: 0 });
    await expect(service.listMine('user-1', page)).resolves.toMatchObject({ total: 0 });
    repository.findMine.mockResolvedValue({ id: 'order-1' });
    await expect(service.getMine('user-1', 'order-1')).resolves.toMatchObject({ id: 'order-1' });
    repository.findMine.mockResolvedValue(null);
    await expect(service.getMine('user-2', 'order-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cancels owned unpaid orders and rejects paid orders', async () => {
    const { repository, service } = setup();
    repository.findMine.mockResolvedValue({ id: 'order-1', paymentStatus: PaymentStatus.UNPAID });
    repository.cancelMine.mockResolvedValue({ id: 'order-1', status: OrderStatus.CANCELLED });
    await expect(service.cancelMine('user-1', 'order-1', { reason: 'Changed mind' })).resolves.toMatchObject({ status: OrderStatus.CANCELLED });
    repository.findMine.mockResolvedValue({ id: 'order-1', paymentStatus: PaymentStatus.PAID });
    await expect(service.cancelMine('user-1', 'order-1', {})).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists and reads admin orders and returns not found for missing orders', async () => {
    const { repository, service } = setup();
    repository.listAll.mockResolvedValue({ items: [], total: 0 });
    await expect(service.listAll({ page: 1, pageSize: 20 } as never)).resolves.toMatchObject({ total: 0 });
    repository.findById.mockResolvedValue({ id: 'order-1' });
    await expect(service.getById('order-1')).resolves.toMatchObject({ id: 'order-1' });
    repository.findById.mockResolvedValue(null);
    await expect(service.getById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enforces valid order transitions and blocks cancellation after payment', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValue({ id: 'order-1', status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID });
    repository.updateStatus.mockResolvedValue({ status: OrderStatus.CONFIRMED });
    await expect(service.updateStatus('order-1', 'admin-1', { status: 'CONFIRMED', isPublic: true })).resolves.toMatchObject({ status: OrderStatus.CONFIRMED });
    await expect(service.updateStatus('order-1', 'admin-1', { status: 'DELIVERED', isPublic: true })).rejects.toBeInstanceOf(ConflictException);
    repository.findById.mockResolvedValue({ id: 'order-1', status: OrderStatus.PENDING, paymentStatus: PaymentStatus.PAID });
    await expect(service.updateStatus('order-1', 'admin-1', { status: 'CANCELLED', isPublic: true })).rejects.toThrow('Paid orders must be refunded');
  });

  it('maps persistence conflicts and accepts valid payment updates', async () => {
    const { repository, service } = setup();
    repository.findById.mockResolvedValue({ id: 'order-1', status: OrderStatus.PENDING, paymentStatus: PaymentStatus.UNPAID });
    repository.updateStatus.mockRejectedValueOnce(prismaError('P2025'));
    await expect(service.updateStatus('order-1', 'admin-1', { status: 'CONFIRMED', isPublic: true })).rejects.toBeInstanceOf(NotFoundException);
    repository.updatePaymentStatus.mockResolvedValue({ status: PaymentStatus.PAID });
    await expect(service.updatePaymentStatus('order-1', 'admin-1', { status: 'PAID' })).resolves.toMatchObject({ status: PaymentStatus.PAID });
    repository.findById.mockResolvedValue({ id: 'order-1', status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.UNPAID });
    await expect(service.updatePaymentStatus('order-1', 'admin-1', { status: 'PAID' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('delegates remarks and return requests and validates return transitions', async () => {
    const { repository, service } = setup();
    repository.addRemark.mockResolvedValue({ id: 'remark-1' });
    await expect(service.addRemark('order-1', 'admin-1', { note: 'Called customer', isInternal: true })).resolves.toMatchObject({ id: 'remark-1' });
    repository.requestReturn.mockResolvedValue({ id: 'return-1' });
    await expect(service.requestReturn('user-1', 'order-1', { itemId: 'item-1' })).resolves.toMatchObject({ id: 'return-1' });
    repository.findReturnById.mockResolvedValue({ id: 'return-1', status: ReturnStatus.REQUESTED });
    repository.updateReturnStatus.mockResolvedValue({ count: 1 });
    await expect(service.updateReturnStatus('return-1', { status: 'APPROVED' })).resolves.toEqual({ id: 'return-1', status: 'APPROVED' });
    await expect(service.updateReturnStatus('return-1', { status: 'RECEIVED' })).rejects.toBeInstanceOf(ConflictException);
    repository.findReturnById.mockResolvedValue(null);
    await expect(service.updateReturnStatus('missing', { status: 'APPROVED' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates shipping rates and maps write failures', async () => {
    const { repository, service } = setup();
    repository.listShippingRates.mockResolvedValue([]);
    repository.saveShippingRate.mockResolvedValue({ charge: new Prisma.Decimal('90.00') });
    await expect(service.listShippingRates()).resolves.toEqual([]);
    await expect(service.saveShippingRate({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '90.00', isActive: true })).resolves.toMatchObject({ charge: new Prisma.Decimal('90.00') });
    repository.saveShippingRate.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.saveShippingRate({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '90', isActive: true })).rejects.toBeInstanceOf(ConflictException);
  });
});
