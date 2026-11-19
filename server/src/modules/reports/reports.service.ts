import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { customerScope } from '../users/customer-scope.js';
import type { ReportQuery } from './reports.schemas.js';

type Normalized = ReportQuery & { from: Date; to: Date; page: number; limit: number };
const num = (value: unknown) => Number(value ?? 0);
const groupBy = <T>(rows: T[], key: (row: T) => string) => {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const name = key(row);
    groups.set(name, [...(groups.get(name) ?? []), row]);
  }
  return groups;
};

@Injectable()
export class ReportsService {
  constructor(private readonly db: PrismaService) {}

  private normalize(input: ReportQuery): Normalized {
    const to = input.to ? new Date(input.to) : new Date();
    to.setHours(23, 59, 59, 999);
    const from = input.from ? new Date(input.from) : new Date(to);
    if (!input.from) from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to || to.getTime() - from.getTime() > 366 * 86_400_000) {
      throw new BadRequestException('Select a valid report date range of at most 366 days.');
    }
    return { ...input, from, to, page: Math.max(1, input.page ?? 1), limit: Math.min(100, Math.max(1, input.limit ?? 12)) };
  }

  private page<T>(rows: T[], query: Normalized) {
    const total = rows.length;
    return { rows: rows.slice((query.page - 1) * query.limit, query.page * query.limit), meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } };
  }

  async sales(input: ReportQuery) {
    const q = this.normalize(input);
    const orders = await this.db.order.findMany({
      where: {
        createdAt: { gte: q.from, lte: q.to },
        ...(q.status ? { status: q.status as OrderStatus } : {}),
        ...(q.paymentStatus ? { paymentStatus: q.paymentStatus as PaymentStatus } : {}),
        ...(q.search ? { OR: [{ orderCode: { contains: q.search, mode: 'insensitive' } }, { shippingName: { contains: q.search, mode: 'insensitive' } }, { shippingPhone: { contains: q.search } }, { contactEmail: { contains: q.search, mode: 'insensitive' } }, { guestEmail: { contains: q.search, mode: 'insensitive' } }, { user: { email: { contains: q.search, mode: 'insensitive' } } }] } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, orderCode: true, shippingName: true, shippingPhone: true, contactEmail: true, guestEmail: true, totalAmount: true, paymentStatus: true, status: true, createdAt: true, user: { select: { email: true } }, items: { select: { quantity: true } } },
    });
    const daily = groupBy(orders, (order) => order.createdAt.toISOString().slice(0, 10));
    const rows = orders.map((order) => ({ id: order.orderCode || order.id, customer: order.shippingName, email: order.user?.email ?? order.contactEmail ?? order.guestEmail, amount: num(order.totalAmount), paymentStatus: order.paymentStatus, orderStatus: order.status, date: order.createdAt, items: order.items.reduce((sum, item) => sum + item.quantity, 0) }));
    const totalSales = orders.reduce((sum, order) => sum + num(order.totalAmount), 0);
    const totalItems = rows.reduce((sum, order) => sum + order.items, 0);
    const statuses = new Map<string, number>();
    for (const order of orders) statuses.set(order.status, (statuses.get(order.status) ?? 0) + 1);
    return { summary: { totalSales, totalOrders: orders.length, totalItems, averageOrderValue: orders.length ? totalSales / orders.length : 0 }, statusDistribution: [...statuses].map(([name, value]) => ({ name, value })), chart: [...daily.entries()].map(([date, day]) => ({ date, revenue: day.reduce((sum, order) => sum + num(order.totalAmount), 0), paidRevenue: day.filter((order) => order.paymentStatus === PaymentStatus.PAID).reduce((sum, order) => sum + num(order.totalAmount), 0), orders: day.length })).sort((a, b) => a.date.localeCompare(b.date)), orders: this.page(rows, q).rows, meta: this.page(rows, q).meta };
  }

  async products(input: ReportQuery) {
    const q = this.normalize(input);
    const items = await this.db.orderItem.findMany({
      where: { order: { createdAt: { gte: q.from, lte: q.to }, status: { not: OrderStatus.CANCELLED } }, ...(q.search ? { OR: [{ productName: { contains: q.search, mode: 'insensitive' } }, { sku: { contains: q.search, mode: 'insensitive' } }] } : {}) },
      select: { productName: true, sku: true, quantity: true, totalPrice: true, variant: { select: { stockQty: true, product: { select: { id: true, category: { select: { name: true } }, variants: { where: { deletedAt: null }, select: { stockQty: true } } } }, media: { where: { isPrimary: true }, take: 1, select: { url: true } } } } },
    });
    const grouped = new Map<string, { id: string; name: string; category: string; unitsSold: number; revenue: number; stock: number; image: string | null }>();
    for (const item of items) {
      const product = item.variant?.product;
      const id = product?.id ?? item.sku ?? item.productName;
      const current = grouped.get(id) ?? { id, name: item.productName, category: product?.category.name ?? 'Uncategorized', unitsSold: 0, revenue: 0, stock: product?.variants.reduce((sum, variant) => sum + variant.stockQty, 0) ?? item.variant?.stockQty ?? 0, image: item.variant?.media[0]?.url ?? null };
      current.unitsSold += item.quantity;
      current.revenue += num(item.totalPrice);
      grouped.set(id, current);
    }
    const products = [...grouped.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
    const categories = new Map<string, number>();
    for (const product of products) categories.set(product.category, (categories.get(product.category) ?? 0) + product.unitsSold);
    return { summary: { totalProducts: await this.db.product.count({ where: { deletedAt: null } }), topSelling: products[0]?.name ?? 'No sales yet', totalUnitsSold: products.reduce((sum, product) => sum + product.unitsSold, 0), productRevenue: products.reduce((sum, product) => sum + product.revenue, 0) }, topProducts: products.slice(0, 10).map((product) => ({ name: product.name, units: product.unitsSold, revenue: product.revenue })), categoryDistribution: [...categories].map(([name, value]) => ({ name, value })), products: this.page(products, q).rows, meta: this.page(products, q).meta };
  }

  async inventory(input: ReportQuery) {
    const q = this.normalize(input);
    const search = q.search ? { OR: [{ sku: { contains: q.search, mode: 'insensitive' as const } }, { name: { contains: q.search, mode: 'insensitive' as const } }, { product: { name: { contains: q.search, mode: 'insensitive' as const } } }] } : {};
    const all = await this.db.productVariant.findMany({
      where: { deletedAt: null, product: { deletedAt: null }, ...search, ...(q.status ? { stockStatus: q.status as 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'PREORDER' } : {}) },
      orderBy: [{ stockQty: 'asc' }, { updatedAt: 'desc' }],
      select: { id: true, name: true, sku: true, stockQty: true, lowStockAlertQty: true, stockStatus: true, updatedAt: true, product: { select: { name: true, category: { select: { name: true } } } }, orderItems: { where: { order: { status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] }, paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PENDING] } } }, select: { quantity: true } } },
    });
    const inventory = all.map((row) => ({ id: row.id, name: row.product.name, variantName: row.name, category: row.product.category.name, sku: row.sku, quantity: row.stockQty, reservedStockQty: row.orderItems.reduce((sum, item) => sum + item.quantity, 0), lowStockAlertQty: row.lowStockAlertQty, status: row.stockStatus, lastUpdated: row.updatedAt }));
    const inStock = inventory.filter((row) => row.status === 'IN_STOCK').length;
    const lowStock = inventory.filter((row) => row.status === 'LOW_STOCK').length;
    const outOfStock = inventory.filter((row) => row.status === 'OUT_OF_STOCK').length;
    return { summary: { total: inventory.length, inStock, lowStock, outOfStock }, inventory: this.page(inventory, q).rows, meta: this.page(inventory, q).meta };
  }

  async customers(input: ReportQuery) {
    const q = this.normalize(input);
    const users = await this.db.user.findMany({
      where: { ...customerScope, ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { email: { contains: q.search, mode: 'insensitive' } }, { phone: { contains: q.search } }] } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, name: true, email: true, phone: true, createdAt: true, orders: { where: { createdAt: { gte: q.from, lte: q.to }, status: { not: OrderStatus.CANCELLED } }, select: { totalAmount: true, createdAt: true } } },
    });
    const rows = users.map((user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, avatar: null, totalOrders: user.orders.length, totalSpent: user.orders.reduce((sum, order) => sum + num(order.totalAmount), 0), lastOrderDate: user.orders.reduce<Date | null>((last, order) => !last || order.createdAt > last ? order.createdAt : last, null), type: user.orders.length > 1 ? 'Returning' : 'New', joinDate: user.createdAt, orders: user.orders }));
    const filtered = q.type ? rows.filter((user) => user.type.toLowerCase() === q.type?.toLowerCase()) : rows;
    const daily = groupBy(users.filter((user) => user.createdAt >= q.from && user.createdAt <= q.to).map((user) => user.createdAt), (date) => date.toISOString().slice(0, 10));
    const newCustomers = rows.filter((user) => user.type === 'New').length;
    const returningCustomers = rows.length - newCustomers;
    return { summary: { totalCustomers: rows.length, newCustomers, returningCustomers, topCustomerRevenue: Math.max(0, ...rows.map((user) => user.totalSpent)) }, chart: [...daily].map(([date, orders]) => ({ date, newCustomers: orders.length })).sort((a, b) => a.date.localeCompare(b.date)), composition: [{ name: 'New', value: newCustomers }, { name: 'Returning', value: returningCustomers }], customers: this.page(filtered, q).rows.map(({ orders: _orders, ...user }) => user), meta: this.page(filtered, q).meta };
  }

  async revenue(input: ReportQuery) {
    const q = this.normalize(input);
    const payments = await this.db.payment.findMany({
      where: { status: PaymentStatus.PAID, createdAt: { gte: q.from, lte: q.to }, ...(q.type ? { method: q.type } : {}) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        amount: true,
        method: true,
        createdAt: true,
        order: {
          select: {
            shippingName: true,
            items: {
              select: {
                totalPrice: true,
                quantity: true,
                variant: {
                  select: {
                    costPrice: true,
                    product: { select: { category: { select: { name: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const revenue = payments.reduce((sum, payment) => sum + num(payment.amount), 0);
    const cost = payments.reduce((sum, payment) => sum + payment.order.items.reduce((itemSum, item) => itemSum + num(item.variant?.costPrice) * item.quantity, 0), 0);
    const byDate = groupBy(payments, (payment) => payment.createdAt.toISOString().slice(0, 10));
    const byMethod = groupBy(payments, (payment) => payment.method);
    const byCategory = new Map<string, number>();
    for (const payment of payments) for (const item of payment.order.items) {
      const category = item.variant?.product.category.name ?? 'Uncategorized';
      byCategory.set(category, (byCategory.get(category) ?? 0) + num(item.totalPrice));
    }
    const transactions = payments.map((payment) => ({ id: payment.id, source: 'Order', customer: payment.order.shippingName, amount: num(payment.amount), method: payment.method, date: payment.createdAt }));
    const page = this.page(transactions, q);
    return { summary: { totalRevenue: revenue, totalCost: cost, netProfit: revenue - cost, profitMargin: revenue ? ((revenue - cost) / revenue) * 100 : 0 }, trend: [...byDate].map(([name, day]) => ({ name, revenue: day.reduce((sum, payment) => sum + num(payment.amount), 0) })).sort((a, b) => a.name.localeCompare(b.name)), paymentMethods: [...byMethod].map(([name, group]) => ({ name, value: group.reduce((sum, payment) => sum + num(payment.amount), 0) })), categories: [...byCategory].map(([name, value]) => ({ name, value })), transactions: page.rows, meta: page.meta };
  }
}
