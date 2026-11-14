import {
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ChallengePurpose, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import type { AuthRepository } from './auth.repository.js';
import type { AuthCrypto } from './services/auth-crypto.service.js';
import type { TokenService } from './services/token.service.js';
import type { OtpService } from './services/otp.service.js';

const now = new Date('2026-01-01T00:00:00Z');

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-id',
    name: 'person',
    email: 'person@example.com',
    emailVerifiedAt: now,
    phone: '+8801712345678',
    phoneVerifiedAt: now,
    passwordHash: 'password-hash',
    authVersion: 0,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function setup() {
  const repo = {
    userByEmail: vi.fn(async () => null),
    userByPhone: vi.fn(async () => null),
    userById: vi.fn(async () => null),
    createEmailUser: vi.fn(async () => makeUser()),
    updatePendingPassword: vi.fn(async () => ({ count: 1 })),
    verifyEmail: vi.fn(async () => null),
    resetPassword: vi.fn(async () => false),
    completePhoneLogin: vi.fn(async () => null),
    linkEmail: vi.fn(async () => null),
    linkPhone: vi.fn(async () => null),
  };
  const crypto = {
    hashPassword: vi.fn(async () => 'password-hash'),
    verifyPassword: vi.fn(async () => true),
  };
  const otp = {
    enforceLimit: vi.fn(async () => {}),
    sendChallenge: vi.fn(async () => {}),
    hash: vi.fn(
      (purpose: string, target: string, code: string) =>
        `${purpose}:${target}:${code}`,
    ),
    isPublicMailFailure: vi.fn(() => false),
  };
  const tokens = {
    issue: vi.fn(async () => ({
      accessToken: 'access',
      refreshToken: 'refresh',
    })),
    refresh: vi.fn(async () => ({ accessToken: 'new-access' })),
    logout: vi.fn(async () => {}),
  };
  const service = new AuthService(
    repo as unknown as AuthRepository,
    crypto as unknown as AuthCrypto,
    otp as unknown as OtpService,
    tokens as unknown as TokenService,
  );
  return { service, repo, crypto, otp, tokens };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('test error', {
    code,
    clientVersion: 'test',
  });
}

describe('AuthService', () => {
  it('returns only public user fields', () => {
    const { service } = setup();
    expect(service.publicUser(makeUser({ passwordHash: 'secret' }) as never)).toEqual({
      id: 'user-id',
      name: 'person',
      role: 'CUSTOMER',
      email: 'person@example.com',
      emailVerified: true,
      phone: '+8801712345678',
      phoneVerified: true,
      createdAt: now,
    });
  });

  it('creates an email account and sends verification', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(null);
    repo.createEmailUser.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);

    await expect(service.signupEmail('person@example.com', 'password', 'ip')).resolves.toEqual({
      message: 'If eligible, a verification message has been sent.',
    });
    expect(repo.createEmailUser).toHaveBeenCalledWith('person@example.com', 'password-hash');
    expect(otp.sendChallenge).toHaveBeenCalledWith(
      ChallengePurpose.VERIFY_EMAIL,
      'person@example.com',
      'user-id',
    );
  });

  it('updates a pending account password before resending verification', async () => {
    const { service, repo, crypto, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    repo.userById.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);

    await service.signupEmail('person@example.com', 'new-password', 'ip');
    expect(crypto.hashPassword).toHaveBeenCalledWith('new-password');
    expect(repo.updatePendingPassword).toHaveBeenCalledWith('user-id', 'password-hash');
    expect(otp.sendChallenge).toHaveBeenCalledOnce();
  });

  it('keeps signup responses generic for verified accounts and duplicate races', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser() as never);
    await service.signupEmail('person@example.com', 'password', 'ip');
    expect(otp.sendChallenge).not.toHaveBeenCalled();

    repo.userByEmail.mockResolvedValueOnce(null);
    repo.createEmailUser.mockRejectedValueOnce(prismaError('P2002'));
    await expect(service.signupEmail('person@example.com', 'password', 'ip')).resolves.toEqual({
      message: 'If eligible, a verification message has been sent.',
    });
  });

  it('suppresses public mail delivery failures but propagates other signup errors', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValue(makeUser({ emailVerifiedAt: null }) as never);
    repo.userById.mockResolvedValue(makeUser({ emailVerifiedAt: null }) as never);
    otp.sendChallenge.mockRejectedValueOnce(new ServiceUnavailableException());
    otp.isPublicMailFailure.mockReturnValueOnce(true);
    await expect(service.signupEmail('person@example.com', 'password', 'ip')).resolves.toMatchObject({
      message: expect.any(String),
    });

    otp.sendChallenge.mockRejectedValueOnce(new Error('mail failure'));
    otp.isPublicMailFailure.mockReturnValueOnce(false);
    await expect(service.signupEmail('person@example.com', 'password', 'ip')).rejects.toThrow('mail failure');
  });

  it('resends verification only to pending accounts and treats public mail failure generically', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    otp.sendChallenge.mockRejectedValueOnce(new ServiceUnavailableException());
    otp.isPublicMailFailure.mockReturnValueOnce(true);
    await expect(service.resendEmailVerification('person@example.com', 'ip')).resolves.toMatchObject({
      message: expect.any(String),
    });
    expect(otp.sendChallenge).toHaveBeenCalledOnce();

    repo.userByEmail.mockResolvedValueOnce(makeUser() as never);
    await service.resendEmailVerification('person@example.com', 'ip');
    expect(otp.sendChallenge).toHaveBeenCalledOnce();
  });

  it('verifies email with the password and one-time code', async () => {
    const { service, repo, crypto, otp } = setup();
    const user = makeUser();
    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    repo.verifyEmail.mockResolvedValueOnce(user as never);

    const result = await service.verifyEmail('person@example.com', '123456', 'password', 'ip');
    expect(result.user.emailVerified).toBe(true);
    expect(crypto.verifyPassword).toHaveBeenCalledWith('password-hash', 'password');
    expect(repo.verifyEmail).toHaveBeenCalledWith(
      'person@example.com',
      `${ChallengePurpose.VERIFY_EMAIL}:person@example.com:123456`,
      'password-hash',
    );
    expect(otp.enforceLimit).toHaveBeenCalledWith('email-verify-check', 'person@example.com', 'ip', true);
  });

  it('rejects invalid email credentials and expired verification codes', async () => {
    const { service, repo, crypto } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    crypto.verifyPassword.mockResolvedValueOnce(false);
    await expect(service.verifyEmail('person@example.com', 'bad', 'wrong', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);

    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    crypto.verifyPassword.mockResolvedValueOnce(true);
    repo.verifyEmail.mockResolvedValueOnce(null);
    await expect(service.verifyEmail('person@example.com', 'bad', 'password', 'ip')).rejects.toThrow('Invalid or expired code');
  });

  it('logs in verified accounts and performs a dummy hash for unknown accounts', async () => {
    const { service, repo, crypto, tokens } = setup();
    const user = makeUser();
    repo.userByEmail.mockResolvedValueOnce(user as never);
    await expect(service.loginEmail('person@example.com', 'password', 'ip')).resolves.toMatchObject({
      accessToken: 'access',
      user: { id: 'user-id' },
    });
    expect(tokens.issue).toHaveBeenCalledWith(user);

    repo.userByEmail.mockResolvedValueOnce(null);
    await expect(service.loginEmail('missing@example.com', 'password', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(crypto.hashPassword).toHaveBeenCalledWith('password');
  });

  it('rejects a wrong password or an unverified email at login', async () => {
    const { service, repo, crypto } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser() as never);
    crypto.verifyPassword.mockResolvedValueOnce(false);
    await expect(service.loginEmail('person@example.com', 'wrong', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);

    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    crypto.verifyPassword.mockResolvedValueOnce(true);
    await expect(service.loginEmail('person@example.com', 'password', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sends reset emails only for verified accounts and returns a generic response', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(makeUser() as never);
    otp.sendChallenge.mockRejectedValueOnce(new ServiceUnavailableException());
    otp.isPublicMailFailure.mockReturnValueOnce(true);
    await service.forgotPassword('person@example.com', 'ip');
    expect(otp.sendChallenge).toHaveBeenCalledWith(ChallengePurpose.RESET_PASSWORD, 'person@example.com', 'user-id');
    repo.userByEmail.mockResolvedValueOnce(makeUser({ emailVerifiedAt: null }) as never);
    await service.forgotPassword('person@example.com', 'ip');
    repo.userByEmail.mockResolvedValueOnce(null);
    await service.forgotPassword('missing@example.com', 'ip');
    expect(otp.sendChallenge).toHaveBeenCalledOnce();
  });

  it('propagates non-public signup persistence and password reset mail failures', async () => {
    const { service, repo, otp } = setup();
    repo.userByEmail.mockResolvedValueOnce(null);
    repo.createEmailUser.mockRejectedValueOnce(prismaError('P2003'));
    await expect(service.signupEmail('person@example.com', 'password', 'ip')).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);

    repo.userByEmail.mockResolvedValueOnce(makeUser() as never);
    otp.sendChallenge.mockRejectedValueOnce(new Error('provider error'));
    otp.isPublicMailFailure.mockReturnValueOnce(false);
    await expect(service.forgotPassword('person@example.com', 'ip')).rejects.toThrow('provider error');
  });

  it('resets passwords for valid codes and rejects invalid codes', async () => {
    const { service, repo, crypto } = setup();
    repo.resetPassword.mockResolvedValueOnce(true);
    await expect(service.resetPassword('person@example.com', '123456', 'new', 'ip')).resolves.toEqual({
      message: 'Password updated. Sign in again.',
    });
    expect(repo.resetPassword).toHaveBeenCalledWith(
      'person@example.com',
      `${ChallengePurpose.RESET_PASSWORD}:person@example.com:123456`,
      'password-hash',
    );
    expect(crypto.hashPassword).toHaveBeenCalledWith('new');
    await expect(service.resetPassword('person@example.com', 'bad', 'new', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('normalizes phone numbers for OTP requests and rejects invalid numbers', async () => {
    const { service, otp } = setup();
    await expect(service.requestPhone('+8801712345678', 'ip')).resolves.toEqual({
      message: 'If eligible, a code has been sent.',
    });
    expect(otp.sendChallenge).toHaveBeenCalledWith(ChallengePurpose.PHONE_LOGIN, '+8801712345678');
    await expect(service.requestPhone('not-a-phone', 'ip')).rejects.toThrow('Invalid phone number');
  });

  it('completes phone login and rejects invalid verification codes', async () => {
    const { service, repo, tokens } = setup();
    repo.completePhoneLogin.mockResolvedValueOnce(makeUser() as never);
    await expect(service.verifyPhone('+8801712345678', '123456', 'ip')).resolves.toMatchObject({ accessToken: 'access' });
    expect(tokens.issue).toHaveBeenCalledOnce();
    repo.completePhoneLogin.mockResolvedValueOnce(null);
    await expect(service.verifyPhone('+8801712345678', 'bad', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requests email linking only when the user can link that address', async () => {
    const { service, repo, otp } = setup();
    repo.userById.mockResolvedValueOnce(makeUser({ email: null, emailVerifiedAt: null }) as never);
    repo.userByEmail.mockResolvedValueOnce(null);
    await expect(service.requestLinkEmail('user-id', 'person@example.com', 'ip')).resolves.toMatchObject({ message: expect.any(String) });
    expect(otp.sendChallenge).toHaveBeenCalledWith(ChallengePurpose.LINK_EMAIL, 'person@example.com', 'user-id');

    repo.userById.mockResolvedValueOnce(null);
    await expect(service.requestLinkEmail('missing', 'person@example.com', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    repo.userById.mockResolvedValueOnce(makeUser({ email: 'old@example.com' }) as never);
    repo.userByEmail.mockResolvedValueOnce(null);
    await expect(service.requestLinkEmail('user-id', 'person@example.com', 'ip')).rejects.toBeInstanceOf(ConflictException);
    repo.userById.mockResolvedValueOnce(makeUser({ email: null, emailVerifiedAt: null }) as never);
    repo.userByEmail.mockResolvedValueOnce(makeUser({ id: 'other-user' }) as never);
    await expect(service.requestLinkEmail('user-id', 'person@example.com', 'ip')).rejects.toBeInstanceOf(ConflictException);
    repo.userById.mockResolvedValueOnce(makeUser() as never);
    repo.userByEmail.mockResolvedValueOnce(null);
    await expect(service.requestLinkEmail('user-id', 'person@example.com', 'ip')).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies linked email and rejects an expired link code', async () => {
    const { service, repo } = setup();
    repo.linkEmail.mockResolvedValueOnce(makeUser() as never);
    await expect(service.verifyLinkEmail('user-id', 'person@example.com', '123456', 'password', 'ip')).resolves.toMatchObject({ user: { id: 'user-id' } });
    repo.linkEmail.mockResolvedValueOnce(null);
    await expect(service.verifyLinkEmail('user-id', 'person@example.com', 'bad', 'password', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requests phone linking only when the user can link that number', async () => {
    const { service, repo, otp } = setup();
    repo.userById.mockResolvedValueOnce(makeUser({ phone: null, phoneVerifiedAt: null }) as never);
    repo.userByPhone.mockResolvedValueOnce(null);
    await expect(service.requestLinkPhone('user-id', '+8801712345678', 'ip')).resolves.toMatchObject({ message: expect.any(String) });
    expect(otp.sendChallenge).toHaveBeenCalledWith(ChallengePurpose.LINK_PHONE, '+8801712345678', 'user-id');

    repo.userById.mockResolvedValueOnce(null);
    await expect(service.requestLinkPhone('missing', '+8801712345678', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    repo.userById.mockResolvedValueOnce(makeUser({ phone: '+8801812345678' }) as never);
    repo.userByPhone.mockResolvedValueOnce(null);
    await expect(service.requestLinkPhone('user-id', '+8801712345678', 'ip')).rejects.toBeInstanceOf(ConflictException);
    repo.userById.mockResolvedValueOnce(makeUser({ phone: null, phoneVerifiedAt: null }) as never);
    repo.userByPhone.mockResolvedValueOnce(makeUser({ id: 'other-user' }) as never);
    await expect(service.requestLinkPhone('user-id', '+8801712345678', 'ip')).rejects.toBeInstanceOf(ConflictException);
    repo.userById.mockResolvedValueOnce(makeUser() as never);
    repo.userByPhone.mockResolvedValueOnce(null);
    await expect(service.requestLinkPhone('user-id', '+8801712345678', 'ip')).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies a linked phone and rejects invalid numbers or expired codes', async () => {
    const { service, repo } = setup();
    repo.linkPhone.mockResolvedValueOnce(makeUser() as never);
    await expect(service.verifyLinkPhone('user-id', '+8801712345678', '123456', 'ip')).resolves.toMatchObject({ user: { id: 'user-id' } });
    repo.linkPhone.mockResolvedValueOnce(null);
    await expect(service.verifyLinkPhone('user-id', '+8801712345678', 'bad', 'ip')).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(service.verifyLinkPhone('user-id', 'invalid', 'bad', 'ip')).rejects.toThrow('Invalid phone number');
  });

  it('returns the current user and rejects unknown ids', async () => {
    const { service, repo } = setup();
    repo.userById.mockResolvedValueOnce(makeUser() as never);
    await expect(service.me('user-id')).resolves.toMatchObject({ user: { id: 'user-id' } });
    repo.userById.mockResolvedValueOnce(null);
    await expect(service.me('missing')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('delegates refresh and logout to the token service', async () => {
    const { service, tokens } = setup();
    await expect(service.refresh('refresh-token')).resolves.toEqual({ accessToken: 'new-access' });
    await expect(service.logout('refresh-token')).resolves.toEqual({ message: 'Signed out.' });
    expect(tokens.refresh).toHaveBeenCalledWith('refresh-token');
    expect(tokens.logout).toHaveBeenCalledWith('refresh-token');
  });
});
