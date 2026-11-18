import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { AppConfigService } from '../../config/app.config.js';

@Injectable()
export class MailService {
  private readonly mailer;

  constructor(private readonly config: AppConfigService) {
    const env = config.values;
    const secure = env.SMTP_PORT === 465 || env.SMTP_PORT === 2465;
    this.mailer = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure,
      ...(env.SMTP_HOST.toLowerCase() === 'smtp.resend.com' && !secure && { requireTLS: true }),
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 10_000,
    });
  }

  async sendVerificationEmail(
    to: string,
    subject: string,
    code: string,
    link?: string,
  ): Promise<void> {
    const text = `${subject}\n\nYour code is ${code}. It expires in 10 minutes.\n${link ? `Continue on Nestt and enter your code: ${link}\n` : ''}If you did not request this, ignore this message.`;
    await this.send(to, subject, text);
  }

  async sendOrderStatusEmail(input: {
    recipient: string;
    historyId: string;
    orderId: string;
    orderCode: string;
    status: string;
    note: string | null;
    createdAt: Date;
    hasAccount: boolean;
  }): Promise<void> {
    const subject = `Nestt order ${input.orderCode} · ${input.status}`;
    const date = new Intl.DateTimeFormat('en-BD', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka',
    }).format(input.createdAt);
    const lines = [`Your Nestt order ${input.orderCode} was updated to ${input.status} on ${date} (Bangladesh time).`];
    if (input.note) lines.push(input.note);
    if (input.hasAccount) {
      const base = this.config.values.APP_BASE_URL.replace(/\/+$/, '');
      lines.push(`View your order: ${base}/account/orders/${input.orderId}`);
    }
    await this.send(input.recipient, subject, lines.join('\n\n'), {
      'Resend-Idempotency-Key': `order-status/${input.historyId}`,
    });
  }

  private async send(to: string, subject: string, text: string, headers?: Record<string, string>) {
    try {
      await this.mailer.sendMail({
        from: this.config.values.MAIL_FROM,
        to,
        subject,
        text,
        headers,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable',
      );
    }
  }
}
