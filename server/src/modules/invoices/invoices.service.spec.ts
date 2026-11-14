import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { InvoicePdfRenderer } from './invoice-pdf.renderer.js';
import { InvoicesService } from './invoices.service.js';

const orderId = '12345678-abcd-4000-8000-123456789012';
const userId = '87654321-abcd-4000-8000-123456789012';

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: orderId,
    createdAt: new Date('2026-10-28T04:30:00.000Z'),
    orderCode: 'NST-ORDER-1',
    user: { email: 'customer@example.com' },
    items: [
      {
        productName: 'Desk',
        variantName: 'Oak',
        sku: 'DSK-1',
        quantity: 2,
        unitPrice: new Prisma.Decimal('10.00'),
        totalPrice: new Prisma.Decimal('20.00'),
      },
    ],
    payments: [
      {
        method: 'CASH_ON_DELIVERY',
        status: PaymentStatus.PAID,
        currency: 'BDT',
        id: 'payment-1',
        transactions: [
          {
            status: 'SUCCESS',
            gatewayTransactionId: 'txn-1',
            rawResponse: null,
            currency: 'BDT',
          },
        ],
      },
    ],
    billingSameAsShipping: true,
    shippingName: 'Customer',
    shippingPhone: '+8801712345678',
    shippingAddress: 'House 1',
    shippingArea: 'Gulshan',
    shippingCity: 'Dhaka',
    shippingRegion: 'Dhaka',
    shippingPostalCode: '1212',
    guestEmail: null,
    billingName: null,
    billingPhone: null,
    billingAddress: null,
    billingArea: null,
    billingCity: null,
    billingRegion: null,
    billingPostalCode: null,
    paymentStatus: PaymentStatus.PAID,
    subTotal: new Prisma.Decimal('20.00'),
    shippingCharge: new Prisma.Decimal('5.00'),
    discountAmount: new Prisma.Decimal('2.00'),
    totalAmount: new Prisma.Decimal('23.00'),
    ...overrides,
  };
}

function serviceWithOrder(result: unknown) {
  const db = { order: { findFirst: vi.fn().mockResolvedValue(result) } };
  return {
    service: new InvoicesService(
      db as unknown as PrismaService,
      new InvoicePdfRenderer(),
    ),
    db,
  };
}

describe('InvoicesService', () => {
  it('creates a PDF with authenticated order details and safely formats the filename', async () => {
    const { service, db } = serviceWithOrder(order());
    const invoice = await service.createAuthenticatedInvoicePdf(
      orderId,
      userId,
    );

    expect(db.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: orderId, userId } }),
    );
    expect(invoice.filename).toMatch(/^NST-INV-20261028-[A-F0-9]{8}\.pdf$/);
    expect(invoice.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('uses guest billing information, fallback payment references and empty optional fields', async () => {
    const data = order({
      user: null,
      guestEmail: 'guest@example.com',
      billingSameAsShipping: false,
      billingName: 'Billing Customer',
      billingPhone: '+8801812345678',
      billingAddress: 'Billing road',
      billingArea: 'Banani',
      billingCity: 'Dhaka',
      billingRegion: 'Dhaka',
      billingPostalCode: null,
      items: [
        {
          productName: 'Single item',
          variantName: null,
          sku: null,
          quantity: 1,
          unitPrice: new Prisma.Decimal(20),
          totalPrice: new Prisma.Decimal(20),
        },
      ],
      payments: [
        {
          method: 'BKASH',
          status: PaymentStatus.PENDING,
          currency: 'BDT',
          id: 'payment-fallback',
          transactions: [
            {
              status: 'FAILED',
              gatewayTransactionId: null,
              rawResponse: { bank_tran_id: 'bank-ref' },
              currency: 'BDT',
            },
          ],
        },
      ],
    });
    const { service } = serviceWithOrder(data);
    const invoice = await service.createAuthenticatedInvoicePdf(
      orderId,
      userId,
    );
    expect(invoice.buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('paginates long orders and handles an order without payment records', async () => {
    const items = Array.from({ length: 55 }, (_, index) => ({
      productName: `Product ${index}`,
      variantName: 'Standard',
      sku: `SKU-${index}`,
      quantity: 1,
      unitPrice: new Prisma.Decimal('1.00'),
      totalPrice: new Prisma.Decimal('1.00'),
    }));
    const data = order({
      items,
      payments: [],
      paymentStatus: PaymentStatus.UNPAID,
      subTotal: new Prisma.Decimal('55.00'),
      shippingCharge: new Prisma.Decimal('0.00'),
      discountAmount: new Prisma.Decimal('0.00'),
      totalAmount: new Prisma.Decimal('55.00'),
    });
    const { service } = serviceWithOrder(data);
    const invoice = await service.createAuthenticatedInvoicePdf(
      orderId,
      userId,
    );
    expect(invoice.buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(invoice.buffer.length).toBeGreaterThan(5000);
  });

  it('does not disclose missing or another user’s orders', async () => {
    const { service } = serviceWithOrder(null);
    await expect(
      service.createAuthenticatedInvoicePdf(orderId, userId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    { quantity: 0, unitPrice: '10.00', totalPrice: '0.00' },
    { quantity: 1, unitPrice: '10.00', totalPrice: '9.00' },
  ])('rejects inconsistent order line totals', async (item) => {
    const invalid = order({
      items: [
        {
          productName: 'Invalid',
          variantName: null,
          sku: null,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.totalPrice),
        },
      ],
      subTotal: new Prisma.Decimal('20.00'),
    });
    const { service } = serviceWithOrder(invalid);
    await expect(
      service.createAuthenticatedInvoicePdf(orderId, userId),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('rejects discounts and grand totals that do not reconcile', async () => {
    const badDiscount = order({ discountAmount: new Prisma.Decimal('21.00') });
    await expect(
      serviceWithOrder(badDiscount).service.createAuthenticatedInvoicePdf(
        orderId,
        userId,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
    const badTotal = order({ totalAmount: new Prisma.Decimal('24.00') });
    await expect(
      serviceWithOrder(badTotal).service.createAuthenticatedInvoicePdf(
        orderId,
        userId,
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
