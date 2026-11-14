import { describe, expect, it } from 'vitest';
import {
  InvoicePdfRenderer,
  type InvoiceData,
} from './invoice-pdf.renderer.js';

describe('InvoicePdfRenderer', () => {
  it('renders the supplied invoice data to a PDF buffer', async () => {
    const data: InvoiceData = {
      invoiceNo: 'NST-INV-20261028-12345678',
      invoiceDate: new Date('2026-10-28T04:30:00.000Z'),
      orderCode: 'NST-ORDER-1',
      customerName: 'Customer',
      customerEmail: 'customer@example.com',
      customerPhone: '+8801712345678',
      address: 'House 1, Dhaka',
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'PAID',
      paymentReference: 'txn-1',
      currency: 'BDT',
      subtotal: 20,
      delivery: 5,
      discount: 2,
      grandTotal: 23,
      items: [
        {
          name: 'Desk - Oak',
          sku: 'DSK-1',
          quantity: 2,
          unitPrice: 10,
          totalPrice: 20,
        },
      ],
    };

    const buffer = await new InvoicePdfRenderer().render(data);

    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
