import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service.js';
import { allocateOrderCode } from './order-numbering.js';
import { OrdersRepository } from './orders.repository.js';

describe('order numbering', () => {
  it('keeps legacy codes until a numbering format is configured', async () => {
    const db = { $queryRaw: vi.fn().mockResolvedValue([]) };
    await expect(
      allocateOrderCode(
        db as unknown as Prisma.TransactionClient,
        'NST-LEGACY',
      ),
    ).resolves.toBe('NST-LEGACY');
  });

  it('skips a code already used by an order', async () => {
    const db = {
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([{ code: 'NST-1001' }])
        .mockResolvedValueOnce([{ code: 'NST-1002' }]),
      order: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ id: 'existing' })
          .mockResolvedValueOnce(null),
      },
    };
    await expect(
      allocateOrderCode(db as unknown as Prisma.TransactionClient, 'fallback'),
    ).resolves.toBe('NST-1002');
    expect(db.order.findUnique).toHaveBeenLastCalledWith({
      where: { orderCode: 'NST-1002' },
      select: { id: true },
    });
  });

  it('recovers orders using the checkout key or the legacy code and keeps the fingerprint check', async () => {
    const order = {
      id: 'order-id',
      orderCode: 'NST-1002',
      metadata: { checkoutFingerprint: 'original' },
    };
    const db = { order: { findFirst: vi.fn().mockResolvedValue(order) } };
    const repository = new OrdersRepository(db as unknown as PrismaService);
    await expect(
      repository.findCheckout('customer-id', 'legacy-key', 'original'),
    ).resolves.toEqual(order);
    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'customer-id',
          OR: [
            { checkoutKey: { is: { key: 'legacy-key' } } },
            { orderCode: 'legacy-key', checkoutKey: null },
          ],
        },
      }),
    );
    await expect(
      repository.findCheckout('customer-id', 'legacy-key', 'changed'),
    ).rejects.toThrow('different details');
  });
});
