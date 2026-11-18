import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import type { MailService } from '../../providers/mail/mail.service.js';
import { OrderStatusEmailService } from './order-status-email.service.js';
import { OrdersRepository } from './orders.repository.js';

describe('Order status email', () => {
  it.each([true, false])('enqueues only public panel updates (isPublic=%s)', async (isPublic) => {
    const statusHistory = { create: vi.fn() };
    const tx = {
      order: {
        findUnique: vi.fn().mockResolvedValue({
          status: 'PENDING', version: 1, contactEmail: 'order@example.test', user: { email: 'account@example.test' },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      orderStatusHistory: statusHistory,
    };
    const repository = new OrdersRepository({
      $transaction: (run: (client: typeof tx) => unknown) => run(tx),
    } as unknown as PrismaService);
    await repository.updateStatus('order-1', 'staff-1', { status: 'CONFIRMED', isPublic }, 1);
    const [{ data }] = statusHistory.create.mock.calls[0];
    expect(data.email).toEqual(isPublic ? { create: { recipient: 'order@example.test' } } : undefined);
  });

  it.each([true, false])('records delivery or schedules a retry (SMTP succeeds=%s)', async (delivered) => {
    const createdAt = new Date();
    const jobs = {
      findMany: vi.fn().mockResolvedValue([{
        historyId: 'history-1', recipient: 'order@example.test', attempts: 0,
        history: { status: 'SHIPPED', note: 'On its way', createdAt, order: { id: 'order-1', orderCode: 'NST-1', userId: 'buyer-1' } },
      }]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const send = delivered ? vi.fn().mockResolvedValue(undefined) : vi.fn().mockRejectedValue(new Error('Offline'));
    const worker = new OrderStatusEmailService(
      { orderStatusEmail: jobs } as unknown as PrismaService,
      { sendOrderStatusEmail: send } as unknown as MailService,
    );
    worker.onApplicationBootstrap();
    await worker.onModuleDestroy();
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      recipient: 'order@example.test', historyId: 'history-1', status: 'Shipped', note: 'On its way',
    }));
    expect(jobs.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: delivered ? { sentAt: expect.any(Date) } : { availableAt: expect.any(Date) },
    }));
  });
});
