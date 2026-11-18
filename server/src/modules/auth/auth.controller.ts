import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import {
  emailLoginSchema,
  emailOnlySchema,
  emailSignupSchema,
  phoneCodeSchema,
  phoneOnlySchema,
  phonePasswordSchema,
  phoneResetPasswordSchema,
  phoneSignupVerifySchema,
  refreshSchema,
  resetPasswordSchema,
  linkEmailVerifySchema,
  verifyEmailSchema,
  updateProfileSchema,
} from './dto/auth.schemas.js';
import type {
  EmailLogin,
  EmailOnly,
  EmailSignup,
  LinkEmailVerify,
  PhoneCode,
  PhoneOnly,
  PhonePassword,
  PhoneResetPassword,
  PhoneSignupVerify,
  Refresh,
  ResetPassword,
  VerifyEmail,
} from './dto/auth.schemas.js';
import { AuthService } from './auth.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('email/signup')
  @HttpCode(HttpStatus.ACCEPTED)
  signupEmail(
    @Body(new ZodValidationPipe(emailSignupSchema)) body: EmailSignup,
    @Req() req: Request,
  ) {
    return this.auth.signupEmail(
      body.email,
      body.password,
      req.ip ?? 'unknown',
    );
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  resendEmail(
    @Body(new ZodValidationPipe(emailOnlySchema)) body: EmailOnly,
    @Req() req: Request,
  ) {
    return this.auth.resendEmailVerification(body.email, req.ip ?? 'unknown');
  }

  @Post('email/verify')
  verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmail,
    @Req() req: Request,
  ) {
    return this.auth.verifyEmail(
      body.email,
      body.code,
      body.password,
      req.ip ?? 'unknown',
    );
  }

  @Post('email/login')
  @HttpCode(HttpStatus.OK)
  loginEmail(
    @Body(new ZodValidationPipe(emailLoginSchema)) body: EmailLogin,
    @Req() req: Request,
  ) {
    return this.auth.loginEmail(body.email, body.password, req.ip ?? 'unknown');
  }

  @Post('email/forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(
    @Body(new ZodValidationPipe(emailOnlySchema)) body: EmailOnly,
    @Req() req: Request,
  ) {
    return this.auth.forgotPassword(body.email, req.ip ?? 'unknown');
  }

  @Post('email/reset-password')
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPassword,
    @Req() req: Request,
  ) {
    return this.auth.resetPassword(
      body.email,
      body.code,
      body.password,
      req.ip ?? 'unknown',
    );
  }

  @Post('phone/request-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  requestPhone(
    @Body(new ZodValidationPipe(phoneOnlySchema)) body: PhoneOnly,
    @Req() req: Request,
  ) {
    return this.auth.requestPhone(body.phone, req.ip ?? 'unknown');
  }

  @Post('phone/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyPhone(
    @Body(new ZodValidationPipe(phoneCodeSchema)) body: PhoneCode,
    @Req() req: Request,
  ) {
    return this.auth.verifyPhone(body.phone, body.code, req.ip ?? 'unknown');
  }

  @Post('customer/phone/signup')
  @HttpCode(HttpStatus.ACCEPTED)
  requestCustomerSignup(
    @Body(new ZodValidationPipe(phoneOnlySchema)) body: PhoneOnly,
    @Req() req: Request,
  ) {
    return this.auth.requestCustomerPhoneSignup(body.phone, req.ip ?? 'unknown');
  }

  @Post('customer/phone/signup/verify')
  @HttpCode(HttpStatus.OK)
  verifyCustomerSignup(
    @Body(new ZodValidationPipe(phoneSignupVerifySchema)) body: PhoneSignupVerify,
    @Req() req: Request,
  ) {
    return this.auth.verifyCustomerPhoneSignup(
      body.phone, body.name, body.password, body.code, req.ip ?? 'unknown',
    );
  }

  @Post('customer/phone/login')
  @HttpCode(HttpStatus.OK)
  loginCustomerPhone(
    @Body(new ZodValidationPipe(phonePasswordSchema)) body: PhonePassword,
    @Req() req: Request,
  ) {
    return this.auth.loginCustomerPhone(body.phone, body.password, req.ip ?? 'unknown');
  }

  @Post('customer/phone/login/request-otp')
  @HttpCode(HttpStatus.ACCEPTED)
  requestCustomerLoginCode(
    @Body(new ZodValidationPipe(phoneOnlySchema)) body: PhoneOnly,
    @Req() req: Request,
  ) {
    return this.auth.requestCustomerPhoneCode(body.phone, req.ip ?? 'unknown', 'login');
  }

  @Post('customer/phone/login/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyCustomerLoginCode(
    @Body(new ZodValidationPipe(phoneCodeSchema)) body: PhoneCode,
    @Req() req: Request,
  ) {
    return this.auth.verifyCustomerPhoneCode(body.phone, body.code, req.ip ?? 'unknown');
  }

  @Post('customer/phone/forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  requestCustomerPasswordReset(
    @Body(new ZodValidationPipe(phoneOnlySchema)) body: PhoneOnly,
    @Req() req: Request,
  ) {
    return this.auth.requestCustomerPhoneCode(body.phone, req.ip ?? 'unknown', 'reset');
  }

  @Post('customer/phone/reset-password')
  @HttpCode(HttpStatus.OK)
  resetCustomerPassword(
    @Body(new ZodValidationPipe(phoneResetPasswordSchema)) body: PhoneResetPassword,
    @Req() req: Request,
  ) {
    return this.auth.resetCustomerPhonePassword(body.phone, body.code, body.password, req.ip ?? 'unknown');
  }

  @Post('link/email/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  requestLinkEmail(
    @Body(new ZodValidationPipe(emailOnlySchema)) body: EmailOnly,
    @Req() req: AuthRequest,
  ) {
    return this.auth.requestLinkEmail(
      req.authUserId,
      body.email,
      req.ip ?? 'unknown',
    );
  }

  @Post('link/email/verify')
  @UseGuards(JwtAuthGuard)
  verifyLinkEmail(
    @Body(new ZodValidationPipe(linkEmailVerifySchema)) body: LinkEmailVerify,
    @Req() req: AuthRequest,
  ) {
    return this.auth.verifyLinkEmail(
      req.authUserId,
      body.email,
      body.code,
      body.password,
      req.ip ?? 'unknown',
    );
  }

  @Post('link/phone/request')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  requestLinkPhone(
    @Body(new ZodValidationPipe(phoneOnlySchema)) body: PhoneOnly,
    @Req() req: AuthRequest,
  ) {
    return this.auth.requestLinkPhone(
      req.authUserId,
      body.phone,
      req.ip ?? 'unknown',
    );
  }

  @Post('link/phone/verify')
  @UseGuards(JwtAuthGuard)
  verifyLinkPhone(
    @Body(new ZodValidationPipe(phoneCodeSchema)) body: PhoneCode,
    @Req() req: AuthRequest,
  ) {
    return this.auth.verifyLinkPhone(
      req.authUserId,
      body.phone,
      body.code,
      req.ip ?? 'unknown',
    );
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body(new ZodValidationPipe(refreshSchema)) body: Refresh) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body(new ZodValidationPipe(refreshSchema)) body: Refresh) {
    return this.auth.logout(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthRequest) {
    return this.auth.me(req.authUserId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Req() req: AuthRequest,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: { name: string },
  ) {
    return this.auth.updateProfile(req.authUserId, body.name);
  }
}
