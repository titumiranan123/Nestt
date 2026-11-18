import {
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import {
  InvoicePdfRenderer,
  INVOICE_TIME_ZONE,
  type InvoiceData,
} from './invoice-pdf.renderer.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfRenderer: InvoicePdfRenderer,
  ) {}

  async createAuthenticatedInvoicePdf(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        user: { select: { email: true } },
        items: { orderBy: { createdAt: 'asc' } },
        payment: {
          include: {
            transactions: { orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    // Avoid revealing whether an order exists when it belongs to another user.
    if (!order) throw new NotFoundException('Order not found');
    this.assertOrderTotalsAreConsistent(order);

    const payment = order.payment;
    const transaction =
      payment?.transactions.find((item) => item.status === 'SUCCESS') ??
      payment?.transactions[0];
    const rawResponse = this.asRecord(transaction?.rawResponse);
    const invoiceNo = this.buildInvoiceNo(order.id, order.createdAt);
    const data: InvoiceData = {
      invoiceNo,
      invoiceDate: order.createdAt,
      orderCode: order.orderCode,
      customerName: order.billingSameAsShipping
        ? order.shippingName
        : (order.billingName ?? order.shippingName),
      customerEmail: order.contactEmail ?? order.user?.email ?? order.guestEmail ?? '',
      customerPhone: order.billingSameAsShipping
        ? order.shippingPhone
        : (order.billingPhone ?? order.shippingPhone),
      address: this.formatAddress(
        order.billingSameAsShipping
          ? [
              order.shippingAddress,
              order.shippingArea,
              order.shippingCity,
              order.shippingRegion,
              order.shippingPostalCode,
            ]
          : [
              order.billingAddress,
              order.billingArea,
              order.billingCity,
              order.billingRegion,
              order.billingPostalCode,
            ],
      ),
      paymentMethod: payment?.method.replaceAll('_', ' ') ?? 'Not available',
      paymentStatus: payment?.status ?? order.paymentStatus,
      paymentReference:
        transaction?.gatewayTransactionId ??
        this.stringValue(rawResponse?.bank_tran_id) ??
        payment?.id ??
        'Not available',
      currency: payment?.currency ?? transaction?.currency ?? 'BDT',
      subtotal: Number(order.subTotal),
      delivery: Number(order.shippingCharge),
      discount: Number(order.discountAmount),
      grandTotal: Number(order.totalAmount),
      items: order.items.map((item) => ({
        name: [item.productName, item.variantName].filter(Boolean).join(' - '),
        sku: item.sku ?? 'N/A',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };

    return {
      buffer: await this.pdfRenderer.render(data),
      filename: `${invoiceNo}.pdf`,
    };
  }

  private assertOrderTotalsAreConsistent(order: {
    id: string;
    subTotal: Prisma.Decimal;
    shippingCharge: Prisma.Decimal;
    discountAmount: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    items: Array<{
      quantity: number;
      unitPrice: Prisma.Decimal;
      totalPrice: Prisma.Decimal;
    }>;
  }) {
    const cents = (amount: Prisma.Decimal) => Math.round(Number(amount) * 100);
    const itemSubtotal = order.items.reduce((sum, item) => {
      const lineTotal = cents(item.totalPrice);
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        cents(item.unitPrice) * item.quantity !== lineTotal ||
        lineTotal < 0
      ) {
        return Number.NaN;
      }
      return sum + lineTotal;
    }, 0);
    const subtotal = cents(order.subTotal);
    const delivery = cents(order.shippingCharge);
    const discount = cents(order.discountAmount);
    const total = cents(order.totalAmount);
    if (
      !Number.isFinite(itemSubtotal) ||
      subtotal !== itemSubtotal ||
      subtotal < 0 ||
      delivery < 0 ||
      discount < 0 ||
      discount > subtotal ||
      total !== Math.max(subtotal - discount, 0) + delivery
    ) {
      throw new InternalServerErrorException(
        `Order ${order.id} totals are inconsistent; invoice cannot be issued`,
      );
    }
  }

  private buildInvoiceNo(orderId: string, date: Date) {
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: INVOICE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(date)
      .replaceAll('-', '');
    return `NST-INV-${day}-${orderId.slice(0, 8).toUpperCase()}`;
  }

  private formatAddress(parts: Array<string | null | undefined>) {
    return parts.filter((part) => Boolean(part?.trim())).join(', ');
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return null;
    return value as Record<string, unknown>;
  }

  private stringValue(value: unknown) {
    return typeof value === 'string' && value.trim() ? value : null;
  }
}
