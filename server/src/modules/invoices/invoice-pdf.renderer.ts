import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import type PDFKit from 'pdfkit';

const BRAND = {
  primary: '#ff6458',
  success: '#16a34a',
  text: '#111111',
  muted: '#666666',
  soft: '#f7f7f7',
  border: '#e5e5e5',
};

export const INVOICE_TIME_ZONE = 'Asia/Dhaka';
const PAGE_MARGIN = 40;

@Injectable()
export class InvoicePdfRenderer {
  async render(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: PAGE_MARGIN,
        bufferPages: true,
        info: {
          Title: data.invoiceNo,
          Author: 'Nestt',
          Subject: `Invoice for order ${data.orderCode}`,
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer | Uint8Array) =>
        chunks.push(Buffer.from(chunk)),
      );
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.drawInvoice(doc, data);
      doc.end();
    });
  }

  private drawInvoice(doc: PDFKit.PDFDocument, data: InvoiceData) {
    const width = doc.page.width - PAGE_MARGIN * 2;
    const rightWidth = 190;
    const leftWidth = width - rightWidth - 24;
    let y = PAGE_MARGIN;

    doc.rect(PAGE_MARGIN, y, width, 4).fill(BRAND.primary);
    y += 22;
    doc
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor(BRAND.primary)
      .text('NESTT', PAGE_MARGIN, y, { width: leftWidth });
    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(BRAND.text)
      .text('INVOICE', PAGE_MARGIN + leftWidth + 24, y, {
        width: rightWidth,
        align: 'right',
      });
    y += 34;

    const right = PAGE_MARGIN + leftWidth + 24;
    const headerRows = [
      ['Invoice No', data.invoiceNo],
      ['Order No', data.orderCode],
      ['Invoice Date', this.formatDate(data.invoiceDate)],
      ['Invoice Time', `${this.formatTime(data.invoiceDate)} (UTC+6)`],
    ];
    doc.font('Helvetica').fontSize(9);
    for (const [label, value] of headerRows) {
      doc.fillColor(BRAND.muted).text(`${label}: ${value}`, right, y, {
        width: rightWidth,
        align: 'right',
      });
      y += 16;
    }
    y += 8;
    doc
      .moveTo(PAGE_MARGIN, y)
      .lineTo(PAGE_MARGIN + width, y)
      .strokeColor(BRAND.border)
      .stroke();
    y += 18;

    const gap = 30;
    const columnWidth = (width - gap) / 2;
    const leftEnd = this.drawMetaBlock(
      doc,
      'BILL TO',
      [data.customerName, data.address, data.customerPhone, data.customerEmail],
      PAGE_MARGIN,
      y,
      columnWidth,
      BRAND.primary,
    );
    const rightEnd = this.drawMetaBlock(
      doc,
      'PAYMENT',
      [
        `${data.paymentMethod} | ${this.paymentStatusLabel(data.paymentStatus)}`,
        `Reference: ${data.paymentReference}`,
        `Currency: ${data.currency}`,
      ],
      PAGE_MARGIN + columnWidth + gap,
      y,
      columnWidth,
      BRAND.success,
    );
    y = Math.max(leftEnd, rightEnd) + 20;

    const columns = {
      item: PAGE_MARGIN + 12,
      qty: PAGE_MARGIN + width - 254,
      unit: PAGE_MARGIN + width - 194,
      total: PAGE_MARGIN + width - 112,
    };
    const itemWidth = width - 270;
    this.drawTableHeader(doc, PAGE_MARGIN, y, width, columns);
    y += 34;

    data.items.forEach((item, index) => {
      const nameHeight = doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .heightOfString(item.name, { width: itemWidth - 24 });
      const rowHeight = Math.max(42, nameHeight + 26);
      if (y + rowHeight > doc.page.height - PAGE_MARGIN - 125) {
        doc.addPage({ margin: PAGE_MARGIN });
        y = PAGE_MARGIN;
        this.drawContinuationHeader(doc, data, PAGE_MARGIN, y, width);
        y += 42;
        this.drawTableHeader(doc, PAGE_MARGIN, y, width, columns);
        y += 34;
      }

      doc
        .rect(PAGE_MARGIN, y, width, rowHeight)
        .fill(index % 2 === 0 ? '#ffffff' : BRAND.soft)
        .strokeColor(BRAND.border)
        .stroke();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(BRAND.text)
        .text(item.name, columns.item, y + 7, { width: itemWidth - 24 });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(BRAND.muted)
        .text(`SKU: ${item.sku}`, columns.item, y + rowHeight - 15, {
          width: itemWidth - 24,
          ellipsis: true,
        });
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(BRAND.text)
        .text(String(item.quantity), columns.qty, y + 15, {
          width: 42,
          align: 'right',
        })
        .text(this.money(item.unitPrice, data.currency), columns.unit, y + 15, {
          width: 72,
          align: 'right',
        })
        .font('Helvetica-Bold')
        .text(
          this.money(item.totalPrice, data.currency),
          columns.total,
          y + 15,
          {
            width: 98,
            align: 'right',
          },
        );
      y += rowHeight + 4;
    });

    const totalsHeight = 116;
    if (y + totalsHeight > doc.page.height - PAGE_MARGIN - 42) {
      doc.addPage({ margin: PAGE_MARGIN });
      y = PAGE_MARGIN;
      this.drawContinuationHeader(doc, data, PAGE_MARGIN, y, width);
      y += 48;
    }
    this.drawTotals(doc, data, PAGE_MARGIN, y, width);

    const pages = doc.bufferedPageRange();
    for (let page = pages.start; page < pages.start + pages.count; page += 1) {
      doc.switchToPage(page);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `This is a computer generated invoice. | ${page - pages.start + 1} of ${pages.count}`,
          PAGE_MARGIN,
          doc.page.height - PAGE_MARGIN - 10,
          { width, align: 'center' },
        );
    }
  }

  private drawMetaBlock(
    doc: PDFKit.PDFDocument,
    title: string,
    lines: string[],
    x: number,
    y: number,
    width: number,
    accent: string,
  ) {
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(accent)
      .text(title, x, y, { width });
    y += 18;
    doc
      .moveTo(x, y)
      .lineTo(x + width, y)
      .strokeColor(BRAND.border)
      .stroke();
    y += 10;
    for (const [index, line] of lines.entries()) {
      if (!line?.trim()) continue;
      doc
        .font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(9)
        .fillColor(index === 0 ? BRAND.text : BRAND.muted)
        .text(line, x, y, { width, lineGap: 2, ellipsis: true });
      y = doc.y + 5;
    }
    return y;
  }

  private drawTableHeader(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    columns: { item: number; qty: number; unit: number; total: number },
  ) {
    doc.rect(x, y, width, 26).fill(BRAND.text);
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#ffffff')
      .text('ITEM', columns.item, y + 8, { width: 150 })
      .text('QTY', columns.qty, y + 8, { width: 42, align: 'right' })
      .text('UNIT PRICE', columns.unit, y + 8, { width: 72, align: 'right' })
      .text('TOTAL', columns.total, y + 8, { width: 98, align: 'right' });
  }

  private drawContinuationHeader(
    doc: PDFKit.PDFDocument,
    data: InvoiceData,
    x: number,
    y: number,
    width: number,
  ) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(BRAND.text)
      .text(`INVOICE ${data.invoiceNo} - continued`, x, y, { width });
    doc
      .moveTo(x, y + 24)
      .lineTo(x + width, y + 24)
      .strokeColor(BRAND.border)
      .stroke();
  }

  private drawTotals(
    doc: PDFKit.PDFDocument,
    data: InvoiceData,
    x: number,
    y: number,
    width: number,
  ) {
    const boxWidth = 250;
    const left = x + width - boxWidth;
    doc
      .roundedRect(left, y, boxWidth, 112, 10)
      .fill('#ffffff')
      .strokeColor(BRAND.border)
      .stroke();
    const rows: Array<[string, string, boolean]> = [
      ['Subtotal', this.money(data.subtotal, data.currency), false],
      ['Delivery', this.money(data.delivery, data.currency), false],
      ['Discount', `- ${this.money(data.discount, data.currency)}`, false],
      ['Grand Total', this.money(data.grandTotal, data.currency), true],
    ];
    let rowY = y + 12;
    for (const [label, value, total] of rows) {
      if (total) {
        doc
          .moveTo(left + 12, rowY - 5)
          .lineTo(left + boxWidth - 12, rowY - 5)
          .strokeColor(BRAND.border)
          .stroke();
      }
      doc
        .font(total ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(total ? 11 : 9)
        .fillColor(total ? BRAND.text : BRAND.muted)
        .text(label, left + 12, rowY, { width: 100 })
        .fillColor(total ? BRAND.primary : BRAND.text)
        .text(value, left + 112, rowY, {
          width: boxWidth - 124,
          align: 'right',
        });
      rowY += total ? 26 : 22;
    }
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: INVOICE_TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private formatTime(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: INVOICE_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
  }

  private money(value: number, currency: string) {
    return `${currency} ${Number(value || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private paymentStatusLabel(status: string) {
    return status === PaymentStatus.PAID ? 'PAID' : status.replaceAll('_', ' ');
  }
}

export type InvoiceData = {
  invoiceNo: string;
  invoiceDate: Date;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string;
  currency: string;
  subtotal: number;
  delivery: number;
  discount: number;
  grandTotal: number;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};
