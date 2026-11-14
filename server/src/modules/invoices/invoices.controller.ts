import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('orders/:orderId/download')
  async download(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const invoice = await this.invoices.createAuthenticatedInvoicePdf(
      orderId,
      req.authUserId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${invoice.filename}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(invoice.buffer);
  }
}
