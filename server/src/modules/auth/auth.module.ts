import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../database/database.module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard.js';
import { MailModule } from '../../providers/mail/mail.module.js';
import { SmsModule } from '../../providers/sms/sms.module.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { AuthCrypto } from './services/auth-crypto.service.js';
import { OtpService } from './services/otp.service.js';
import { TokenService } from './services/token.service.js';
import { RedisAuthStore } from './redis-auth-store.service.js';

@Module({
  imports: [JwtModule.register({}), DatabaseModule, MailModule, SmsModule],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    RedisAuthStore,
    AuthCrypto,
    OtpService,
    TokenService,
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    TokenService,
    AuthCrypto,
    RedisAuthStore,
    OtpService,
    AuthService,
  ],
})
export class AuthModule {}
