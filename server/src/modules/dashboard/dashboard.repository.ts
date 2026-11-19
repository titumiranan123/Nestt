import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  Prisma,
  StockStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { inventoryVariantWhere } from '../inventory/inventory.utils.js';
import { customerScope } from '../users/customer-scope.js';
import {
  DASHBOARD_TIME_ZONE,
  type dashboardWindow,
} from './dashboard-period.js';

type DashboardWindow = ReturnType<typeof dashboardWindow>;
const paidOrder = {
  paymentStatus: PaymentStatus.PAID,
  status: { not: OrderStatus.CANCELLED },
} satisfies Prisma.OrderWhereInput;

@Injectable()
export class DashboardRepository {
  constructor(private readonly db: PrismaService) {}

  overview({ current, previous, granularity }: DashboardWindow) {
    const products = { deletedAt: null };
    const lowStock = this.lowStockWhere();

    return this.db.$transaction(
      [
        this.db.$queryRaw<{ bucket: string; amount: Prisma.Decimal }[]>`
        SELECT to_char(date_trunc(${granularity}, "created_at" AT TIME ZONE 'UTC' AT TIME ZONE ${DASHBOARD_TIME_ZONE}),
                       'YYYY-MM-DD"T"HH24:MI:SS') AS bucket,
               SUM("total_amount") AS amount
        FROM "orders"
        WHERE "created_at" >= ${current.gte.toISOString()}::timestamp
          AND "created_at" < ${current.lt.toISOString()}::timestamp
          AND "payment_status" = ${PaymentStatus.PAID}::"PaymentStatus"
          AND "status" <> ${OrderStatus.CANCELLED}::"OrderStatus"
        GROUP BY 1
      `,
        this.db.order.aggregate({
          where: { ...paidOrder, createdAt: previous },
          _sum: { totalAmount: true },
        }),
        this.db.order.count({ where: { createdAt: current } }),
        this.db.order.count({ where: { createdAt: previous } }),
        this.db.product.count({ where: products }),
        this.db.product.count({ where: { ...products, createdAt: current } }),
        this.db.user.count({ where: customerScope }),
        this.db.user.count({ where: { ...customerScope, createdAt: current } }),
        this.db.productVariant.count({ where: lowStock }),
        this.db.category.count({
          where: { products: { some: { variants: { some: lowStock } } } },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  recentOrders(createdAt: DashboardWindow['current']) {
    return this.db.order.findMany({
      where: { createdAt },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 5,
      select: {
        id: true,
        orderCode: true,
        shippingName: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
      },
    });
  }

  inventoryAlerts() {
    return this.db.productVariant.findMany({
      where: this.lowStockWhere(),
      orderBy: [{ stockQty: 'asc' }, { sku: 'asc' }],
      take: 4,
      select: {
        sku: true,
        stockQty: true,
        product: { select: { name: true } },
      },
    });
  }

  private lowStockWhere() {
    return {
      ...inventoryVariantWhere,
      stockStatus: { not: StockStatus.PREORDER },
      OR: [
        { stockQty: { lte: 0 } },
        { stockQty: { lte: this.db.productVariant.fields.lowStockAlertQty } },
      ],
    } satisfies Prisma.ProductVariantWhereInput;
  }
}
