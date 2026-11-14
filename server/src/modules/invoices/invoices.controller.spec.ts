import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import type { InvoicesService } from './invoices.service.js';
import { InvoicesController } from './invoices.controller.js';

describe('InvoicesController', () => {
  it('returns a private PDF attachment for the authenticated user', async () => {
    const invoice = {
      filename: 'invoice.pdf',
      buffer: Buffer.from('%PDF-test'),
    };
    const service = {
      createAuthenticatedInvoicePdf: vi.fn().mockResolvedValue(invoice),
    };
    const response = { setHeader: vi.fn(), send: vi.fn() };
    const controller = new InvoicesController(
      service as unknown as InvoicesService,
    );

    await controller.download(
      'order-id',
      { authUserId: 'user-id' } as AuthRequest,
      response as unknown as Response,
    );

    expect(service.createAuthenticatedInvoicePdf).toHaveBeenCalledWith(
      'order-id',
      'user-id',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="invoice.pdf"',
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(response.send).toHaveBeenCalledWith(invoice.buffer);
  });
});
