import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, RoleEnum, User, UserStatus } from '@prisma/client';
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import { AuthCrypto } from './services/auth-crypto.service.js';
import { AuthRepository } from './auth.repository.js';
import { TokenService } from './services/token.service.js';
import { OtpService } from './services/otp.service.js';
import { ChallengePurpose } from './challenge-purpose.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly repo: AuthRepository,
    private readonly crypto: AuthCrypto,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
  ) {}

  publicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      emailVerified: !!user.emailVerifiedAt,
      phone: user.phone,
      phoneVerified: !!user.phoneVerifiedAt,
      createdAt: user.createdAt,
    };
  }

  private normalizePhone(input: string): string {
    if (!isValidPhoneNumber(input))
      throw new BadRequestException('Invalid phone number');
    return parsePhoneNumberFromString(input)!.number;
  }

  async signupEmail(email: string, password: string, ip: string) {
    await this.otp.enforceLimit('email-signup', email, ip);
    let user = await this.repo.userByEmail(email);
    if (!user) {
      const hash = await this.crypto.hashPassword(password);
      try {
        user = await this.repo.createEmailUser(email, hash);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          return {
            message: 'If eligible, a verification message has been sent.',
          };
        throw error;
      }
    } else if (!user.emailVerifiedAt) {
      const hash = await this.crypto.hashPassword(password);
      await this.repo.updatePendingPassword(user.id, hash);
      user = await this.repo.userById(user.id);
    }
    if (user && !user.emailVerifiedAt) {
      try {
        await this.otp.sendChallenge(
          ChallengePurpose.VERIFY_EMAIL,
          email,
          user.id,
        );
      } catch (error) {
        this.swallowPublicMailFailure(error);
      }
    }
    return { message: 'If eligible, a verification message has been sent.' };
  }

  async resendEmailVerification(email: string, ip: string) {
    await this.otp.enforceLimit('email-verify-send', email, ip);
    const user = await this.repo.userByEmail(email);
    if (user && !user.emailVerifiedAt) {
      try {
        await this.otp.sendChallenge(
          ChallengePurpose.VERIFY_EMAIL,
          email,
          user.id,
        );
      } catch (error) {
        this.swallowPublicMailFailure(error);
      }
    }
    return { message: 'If eligible, a verification message has been sent.' };
  }

  async verifyEmail(email: string, code: string, password: string, ip: string) {
    await this.otp.enforceLimit('email-verify-check', email, ip, true);
    const pending = await this.repo.userByEmail(email);
    const valid =
      pending?.passwordHash && !pending.emailVerifiedAt
        ? await this.crypto.verifyPassword(pending.passwordHash, password)
        : false;
    if (!valid || !pending?.passwordHash)
      throw new UnauthorizedException('Invalid credentials or code');
    const user = await this.repo.verifyEmail(
      email,
      this.otp.hash(ChallengePurpose.VERIFY_EMAIL, email, code),
      pending.passwordHash,
    );
    if (!user) throw new UnauthorizedException('Invalid or expired code');
    return { user: this.publicUser(user) };
  }

  async loginEmail(email: string, password: string, ip: string) {
    await this.otp.enforceLimit('email-login', email, ip, true);
    const user = await this.repo.userByEmail(email);
    const valid = user?.passwordHash
      ? await this.crypto.verifyPassword(user.passwordHash, password)
      : (await this.crypto.hashPassword(password), false);
    if (
      !valid ||
      !user?.emailVerifiedAt ||
      user.status !== UserStatus.ACTIVE
    )
      throw new UnauthorizedException(
        'Invalid credentials or unverified email',
      );
    return {
      user: {
        ...this.publicUser(user),
        permissions: await this.repo.permissionsForUser(user.id, user.role),
      },
      ...(await this.tokens.issue(user)),
    };
  }

  async forgotPassword(email: string, ip: string) {
    await this.otp.enforceLimit('password-reset-send', email, ip);
    const user = await this.repo.userByEmail(email);
    if (user?.emailVerifiedAt) {
      try {
        await this.otp.sendChallenge(
          ChallengePurpose.RESET_PASSWORD,
          email,
          user.id,
        );
      } catch (error) {
        this.swallowPublicMailFailure(error);
      }
    }
    return { message: 'If the account exists, a reset message has been sent.' };
  }

  async resetPassword(
    email: string,
    code: string,
    password: string,
    ip: string,
  ) {
    await this.otp.enforceLimit('password-reset-check', email, ip, true);
    const hash = await this.crypto.hashPassword(password);
    const okay = await this.repo.resetPassword(
      email,
      this.otp.hash(ChallengePurpose.RESET_PASSWORD, email, code),
      hash,
    );
    if (!okay) throw new UnauthorizedException('Invalid or expired code');
    return { message: 'Password updated. Sign in again.' };
  }

  async requestPhone(input: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('phone-login-send', phone, ip);
    await this.otp.sendChallenge(ChallengePurpose.PHONE_LOGIN, phone);
    return { message: 'If eligible, a code has been sent.' };
  }

  async verifyPhone(input: string, code: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('phone-login-check', phone, ip, true);
    const user = await this.repo.completePhoneLogin(
      phone,
      this.otp.hash(ChallengePurpose.PHONE_LOGIN, phone, code),
    );
    if (!user || user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('Invalid or expired code');
    return { user: this.publicUser(user), ...(await this.tokens.issue(user)) };
  }

  async findOrCreateCheckoutCustomer(phoneInput: string, name: string): Promise<User> {
    const phone = this.normalizePhone(phoneInput);
    let user = await this.repo.userByPhone(phone);
    if (!user) user = await this.repo.createCheckoutPhoneCustomer(phone, name.trim());
    if (!user || user.role !== RoleEnum.CUSTOMER || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This phone number cannot be used for customer checkout.');
    }
    if (!user.isPhoneVerified || !user.phoneVerifiedAt) {
      user = await this.repo.markPhoneVerified(user.id);
    }
    return user;
  }

  async issueCheckoutSession(userId: string) {
    const user = await this.repo.userById(userId);
    if (!user || user.role !== RoleEnum.CUSTOMER || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Customer account is unavailable.');
    }
    return this.tokens.issue(user);
  }

  async requestCustomerPhoneSignup(input: string, ip: string) {
    const phone = this.normalizePhone(input);
    this.otp.assertPhoneDelivery();
    await this.otp.enforceLimit('customer-phone-signup-send', phone, ip);
    if (!(await this.repo.userByPhone(phone))) {
      await this.sendPublicCustomerSms(ChallengePurpose.CUSTOMER_PHONE_SIGNUP, phone);
    }
    return { message: 'If eligible, a verification code has been sent.' };
  }

  async verifyCustomerPhoneSignup(input: string, name: string, password: string, code: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('customer-phone-signup-check', phone, ip, true);
    const passwordHash = await this.crypto.hashPassword(password);
    const user = await this.repo.createVerifiedPhoneCustomer(
      phone, name, this.otp.hash(ChallengePurpose.CUSTOMER_PHONE_SIGNUP, phone, code), passwordHash,
    );
    if (!user) throw new UnauthorizedException('Invalid or expired signup code');
    return { user: this.publicUser(user), ...(await this.tokens.issue(user)) };
  }

  async loginCustomerPhone(input: string, password: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('customer-phone-password-login', phone, ip, true);
    const user = await this.verifiedPhoneCustomer(phone);
    const valid = user?.passwordHash
      ? await this.crypto.verifyPassword(user.passwordHash, password)
      : (await this.crypto.hashPassword(password), false);
    if (!user || !valid) throw new UnauthorizedException('Invalid phone number or password');
    return { user: this.publicUser(user), ...(await this.tokens.issue(user)) };
  }

  async requestCustomerPhoneCode(input: string, ip: string, purpose: 'login' | 'reset') {
    const phone = this.normalizePhone(input);
    this.otp.assertPhoneDelivery();
    await this.otp.enforceLimit(`customer-phone-${purpose}-send`, phone, ip);
    const user = await this.verifiedPhoneCustomer(phone);
    if (user) {
      const challenge = purpose === 'login' ? ChallengePurpose.CUSTOMER_PHONE_LOGIN : ChallengePurpose.RESET_PHONE_PASSWORD;
      await this.sendPublicCustomerSms(challenge, phone, user.id);
    }
    return { message: 'If the account is eligible, a code has been sent.' };
  }

  async verifyCustomerPhoneCode(input: string, code: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('customer-phone-login-check', phone, ip, true);
    const current = await this.verifiedPhoneCustomer(phone);
    if (!current) throw new UnauthorizedException('Invalid or expired code');
    const user = await this.repo.verifyCustomerPhoneLogin(
      current.id, phone, this.otp.hash(ChallengePurpose.CUSTOMER_PHONE_LOGIN, phone, code),
    );
    if (!user) throw new UnauthorizedException('Invalid or expired code');
    return { user: this.publicUser(user), ...(await this.tokens.issue(user)) };
  }

  async resetCustomerPhonePassword(input: string, code: string, password: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('customer-phone-reset-check', phone, ip, true);
    const passwordHash = await this.crypto.hashPassword(password);
    const user = await this.verifiedPhoneCustomer(phone);
    const updated = user && await this.repo.resetCustomerPhonePassword(
      user.id, phone, this.otp.hash(ChallengePurpose.RESET_PHONE_PASSWORD, phone, code), passwordHash, user.authVersion,
    );
    if (!updated) throw new UnauthorizedException('Invalid or expired reset code');
    return { message: 'Password updated. Sign in again.' };
  }

  private async verifiedPhoneCustomer(phone: string) {
    const user = await this.repo.userByPhone(phone);
    return user?.phoneVerifiedAt && user.role === RoleEnum.CUSTOMER && user.status === UserStatus.ACTIVE
      ? user
      : null;
  }

  private async sendPublicCustomerSms(purpose: ChallengePurpose, phone: string, userId?: string) {
    try {
      await this.otp.sendChallenge(purpose, phone, userId);
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error;
      this.logger.warn('Public customer SMS delivery failed');
    }
  }

  async requestLinkEmail(userId: string, email: string, ip: string) {
    await this.otp.enforceLimit('link-email-send', email, ip);
    const [user, owner] = await Promise.all([
      this.repo.userById(userId),
      this.repo.userByEmail(email),
    ]);
    if (!user) throw new UnauthorizedException();
    if (user.email && user.email !== email)
      throw new ConflictException('Email already linked');
    if (owner && owner.id !== userId)
      throw new ConflictException('Email already in use');
    if (user.emailVerifiedAt)
      throw new ConflictException('Email already verified');
    await this.otp.sendChallenge(ChallengePurpose.LINK_EMAIL, email, userId);
    return { message: 'Verification message sent.' };
  }

  async verifyLinkEmail(
    userId: string,
    email: string,
    code: string,
    password: string,
    ip: string,
  ) {
    await this.otp.enforceLimit('link-email-check', email, ip, true);
    const hash = await this.crypto.hashPassword(password);
    const user = await this.repo.linkEmail(
      userId,
      email,
      this.otp.hash(ChallengePurpose.LINK_EMAIL, email, code),
      hash,
    );
    if (!user) throw new UnauthorizedException('Invalid or expired code');
    return { user: this.publicUser(user) };
  }

  async requestLinkPhone(userId: string, input: string, ip: string) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('link-phone-send', phone, ip);
    const [user, owner] = await Promise.all([
      this.repo.userById(userId),
      this.repo.userByPhone(phone),
    ]);
    if (!user) throw new UnauthorizedException();
    if (user.phone && user.phone !== phone)
      throw new ConflictException('Phone already linked');
    if (owner && owner.id !== userId)
      throw new ConflictException('Phone already in use');
    if (user.phoneVerifiedAt)
      throw new ConflictException('Phone already verified');
    await this.otp.sendChallenge(ChallengePurpose.LINK_PHONE, phone, userId);
    return { message: 'Verification code sent.' };
  }

  async verifyLinkPhone(
    userId: string,
    input: string,
    code: string,
    ip: string,
  ) {
    const phone = this.normalizePhone(input);
    await this.otp.enforceLimit('link-phone-check', phone, ip, true);
    const user = await this.repo.linkPhone(
      userId,
      phone,
      this.otp.hash(ChallengePurpose.LINK_PHONE, phone, code),
    );
    if (!user) throw new UnauthorizedException('Invalid or expired code');
    return { user: this.publicUser(user) };
  }

  async me(userId: string) {
    const user = await this.repo.userById(userId);
    if (!user) throw new UnauthorizedException();
    return {
      user: {
        ...this.publicUser(user),
        permissions: await this.repo.permissionsForUser(user.id, user.role),
      },
    };
  }

  async updateProfile(userId: string, name: string) {
    return { user: this.publicUser(await this.repo.updateName(userId, name)) };
  }

  refresh(token: string) {
    return this.tokens.refresh(token);
  }
  async logout(token: string) {
    await this.tokens.logout(token);
    return { message: 'Signed out.' };
  }

  private swallowPublicMailFailure(error: unknown): void {
    if (!this.otp.isPublicMailFailure(error)) throw error;
    this.logger.warn('Public auth email delivery failed');
  }
}
