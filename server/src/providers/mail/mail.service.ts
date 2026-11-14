import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { AppConfigService } from '../../config/app.config.js';

@Injectable()
export class MailService {
  private readonly mailer;

  constructor(private readonly config: AppConfigService) {
    const env = config.values;
    this.mailer = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }

  async sendVerificationEmail(
    to: string,
    subject: string,
    code: string,
    link?: string,
  ): Promise<void> {
    try {
      await this.mailer.sendMail({
        from: this.config.values.MAIL_FROM,
        to,
        subject,
        text: `${subject}\n\nYour code is ${code}. It expires in 10 minutes.\n${link ? `Or use this link: ${link}\n` : ''}If you did not request this, ignore this message.`,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Email delivery is temporarily unavailable',
      );
    }
  }
}
