import { Injectable, Logger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { MailService } from '../../providers/mail/mail.service.js';

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

@Injectable()
export class OrderStatusEmailService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OrderStatusEmailService.name);
  private timer?: ReturnType<typeof setInterval>;
  private active?: Promise<void>;

  constructor(private readonly db: PrismaService, private readonly mail: MailService) {}

  onApplicationBootstrap() {
    this.timer = setInterval(() => this.flush(), 15_000);
    this.timer.unref();
    this.flush();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.active;
  }

  private flush() {
    this.active ??= this.sendAvailable()
      .catch(() => this.logger.warn('Could not process queued order status emails'))
      .finally(() => { this.active = undefined; });
  }

  private async sendAvailable() {
    const emails = await this.db.orderStatusEmail.findMany({
      where: { sentAt: null, availableAt: { lte: new Date() } },
      orderBy: { availableAt: 'asc' },
      take: 10,
      include: { history: { include: { order: { select: { id: true, orderCode: true, userId: true } } } } },
    });
    for (const { historyId, recipient, attempts, history } of emails) {
      const lease = new Date(Date.now() + 5 * 60_000);
      const claimed = await this.db.orderStatusEmail.updateMany({
        where: { historyId, sentAt: null, availableAt: { lte: new Date() } },
        data: { availableAt: lease, attempts: { increment: 1 } },
      });
      if (!claimed.count) continue;
      const claim = { historyId, sentAt: null, availableAt: lease };
      try {
        await this.mail.sendOrderStatusEmail({
          recipient, historyId, orderId: history.order.id, orderCode: history.order.orderCode,
          status: statusLabels[history.status], note: history.note, createdAt: history.createdAt,
          hasAccount: Boolean(history.order.userId),
        });
      } catch {
        const delayMinutes = Math.min(2 ** attempts, 30);
        await this.db.orderStatusEmail.updateMany({
          where: claim,
          data: { availableAt: new Date(Date.now() + delayMinutes * 60_000) },
        });
        this.logger.warn('Order status email delivery failed and will retry');
        continue;
      }
      await this.db.orderStatusEmail.updateMany({ where: claim, data: { sentAt: new Date() } });
    }
  }
}
