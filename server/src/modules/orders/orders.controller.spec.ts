import { describe, expect, it, vi } from 'vitest';
import { OrdersAdminController } from './orders-admin.controller.js';
import { OrdersController } from './orders.controller.js';
import type { OrdersService } from './orders.service.js';
import type { SslCheckoutService } from './ssl-checkout.service.js';

describe('OrdersController', () => {
  it('delegates checkout, own-order queries, cancel, and return requests', async () => {
    const orders = {
      create: vi.fn(), listMine: vi.fn(), getMine: vi.fn(), cancelMine: vi.fn(), requestReturn: vi.fn(),
    };
    const controller = new OrdersController(orders as unknown as OrdersService, {} as SslCheckoutService);
    const request = { authUserId: 'user-1' } as never;
    await Promise.all([
      controller.create(request, { items: [], billingSameAsShipping: true } as never),
      controller.list(request, { page: 1, pageSize: 20 } as never),
      controller.get(request, 'order-1'),
      controller.cancel(request, 'order-1', { reason: 'Changed mind' }),
      controller.requestReturn(request, 'order-1', { itemId: 'item-1' }),
    ]);
    expect(orders.create).toHaveBeenCalledWith('user-1', { items: [], billingSameAsShipping: true }, 'unknown');
    expect(orders.listMine).toHaveBeenCalledWith('user-1', { page: 1, pageSize: 20 });
    expect(orders.getMine).toHaveBeenCalledWith('user-1', 'order-1');
    expect(orders.cancelMine).toHaveBeenCalledWith('user-1', 'order-1', { reason: 'Changed mind' });
    expect(orders.requestReturn).toHaveBeenCalledWith('user-1', 'order-1', { itemId: 'item-1' });
  });
});

describe('OrdersAdminController', () => {
  it('delegates order, payment, return, remark, and delivery-rate management', async () => {
    const orders = {
      listAll: vi.fn(), getById: vi.fn(), updateStatus: vi.fn(), updatePaymentStatus: vi.fn(),
      addRemark: vi.fn(), updateReturnStatus: vi.fn(), listShippingRates: vi.fn(), saveShippingRate: vi.fn(),
    };
    const controller = new OrdersAdminController(orders as unknown as OrdersService);
    const request = { authUserId: 'admin-id' } as never;
    await Promise.all([
      controller.list({ page: 1, pageSize: 20 } as never),
      controller.get('order-1'),
      controller.updateStatus('order-1', request, { status: 'CONFIRMED', isPublic: true }),
      controller.updatePayment('order-1', request, { status: 'PAID' }),
      controller.addRemark('order-1', request, { note: 'Confirmed by phone', isInternal: true }),
      controller.updateReturn('return-1', { status: 'APPROVED' }),
      controller.listShippingRates(),
      controller.saveShippingRate({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '100', isActive: true }),
    ]);
    expect(orders.listAll).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(orders.getById).toHaveBeenCalledWith('order-1');
    expect(orders.updateStatus).toHaveBeenCalledWith('order-1', 'admin-id', { status: 'CONFIRMED', isPublic: true });
    expect(orders.updatePaymentStatus).toHaveBeenCalledWith('order-1', 'admin-id', { status: 'PAID' });
    expect(orders.addRemark).toHaveBeenCalledWith('order-1', 'admin-id', { note: 'Confirmed by phone', isInternal: true });
    expect(orders.updateReturnStatus).toHaveBeenCalledWith('return-1', { status: 'APPROVED' });
    expect(orders.listShippingRates).toHaveBeenCalledOnce();
    expect(orders.saveShippingRate).toHaveBeenCalledWith({ region: 'Dhaka', city: 'Dhaka', area: 'Gulshan', charge: '100', isActive: true });
  });
});
