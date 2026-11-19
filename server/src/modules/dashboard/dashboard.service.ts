import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { dashboardWindow, type DashboardPeriod } from './dashboard-period.js';
import { DashboardRepository } from './dashboard.repository.js';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async overview(period: DashboardPeriod) {
    const window = dashboardWindow(period);
    const [
      paidBuckets,
      previousRevenue,
      orders,
      previousOrders,
      products,
      newProducts,
      customers,
      newCustomers,
      lowStock,
      categories,
    ] = await this.repository.overview(window);
    const amounts = new Map(
      paidBuckets.map(({ bucket, amount }) => [bucket, amount]),
    );
    const totalRevenue = paidBuckets.reduce(
      (total, { amount }) => total.plus(amount),
      new Prisma.Decimal(0),
    );

    return {
      revenue: {
        total: totalRevenue.toString(),
        previous: previousRevenue._sum.totalAmount?.toString() ?? '0',
      },
      orders: { total: orders, previous: previousOrders },
      products: { total: products, added: newProducts },
      customers: { total: customers, added: newCustomers },
      lowStock: { total: lowStock, categories },
      series: window.buckets.map(({ key, start }) => ({
        start,
        amount: amounts.get(key)?.toString() ?? '0',
      })),
    };
  }

  recentOrders(period: DashboardPeriod) {
    return this.repository.recentOrders(dashboardWindow(period).current);
  }

  async inventoryAlerts() {
    const variants = await this.repository.inventoryAlerts();
    return variants.map(({ sku, stockQty, product }) => ({
      sku,
      available: stockQty,
      product: product.name,
    }));
  }
}
