import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

describe('AuthController', () => {
  it('delegates every authentication route with the validated values and request context', async () => {
    const auth = Object.fromEntries([
      'signupEmail', 'resendEmailVerification', 'verifyEmail', 'loginEmail',
      'forgotPassword', 'resetPassword', 'requestPhone', 'verifyPhone',
      'requestLinkEmail', 'verifyLinkEmail', 'requestLinkPhone', 'verifyLinkPhone',
      'refresh', 'logout', 'me',
    ].map((method) => [method, vi.fn()]));
    const controller = new AuthController(auth as unknown as AuthService);
    const req = { ip: '127.0.0.1', authUserId: 'user-1' } as never;

    await Promise.all([
      controller.signupEmail({ email: 'a@example.com', password: 'pw' }, req),
      controller.resendEmail({ email: 'a@example.com' }, req),
      controller.verifyEmail({ email: 'a@example.com', code: '123456', password: 'pw' }, req),
      controller.loginEmail({ email: 'a@example.com', password: 'pw' }, req),
      controller.forgotPassword({ email: 'a@example.com' }, req),
      controller.resetPassword({ email: 'a@example.com', code: '123456', password: 'pw' }, req),
      controller.requestPhone({ phone: '+15551234567' }, req),
      controller.verifyPhone({ phone: '+15551234567', code: '123456' }, req),
      controller.requestLinkEmail({ email: 'a@example.com' }, req),
      controller.verifyLinkEmail({ email: 'a@example.com', code: '123456', password: 'pw' }, req),
      controller.requestLinkPhone({ phone: '+15551234567' }, req),
      controller.verifyLinkPhone({ phone: '+15551234567', code: '123456' }, req),
      controller.refresh({ refreshToken: 'refresh' }),
      controller.logout({ refreshToken: 'refresh' }),
      controller.me(req),
    ]);

    const requestWithoutIp = { authUserId: 'user-1' } as never;
    await Promise.all([
      controller.signupEmail({ email: 'b@example.com', password: 'pw' }, requestWithoutIp),
      controller.resendEmail({ email: 'b@example.com' }, requestWithoutIp),
      controller.verifyEmail({ email: 'b@example.com', code: '123456', password: 'pw' }, requestWithoutIp),
      controller.loginEmail({ email: 'b@example.com', password: 'pw' }, requestWithoutIp),
      controller.forgotPassword({ email: 'b@example.com' }, requestWithoutIp),
      controller.resetPassword({ email: 'b@example.com', code: '123456', password: 'pw' }, requestWithoutIp),
      controller.requestPhone({ phone: '+15551234567' }, requestWithoutIp),
      controller.verifyPhone({ phone: '+15551234567', code: '123456' }, requestWithoutIp),
      controller.requestLinkEmail({ email: 'b@example.com' }, requestWithoutIp),
      controller.verifyLinkEmail({ email: 'b@example.com', code: '123456', password: 'pw' }, requestWithoutIp),
      controller.requestLinkPhone({ phone: '+15551234567' }, requestWithoutIp),
      controller.verifyLinkPhone({ phone: '+15551234567', code: '123456' }, requestWithoutIp),
      controller.me(requestWithoutIp),
    ]);

    expect(Object.values(auth).every((method) => method.mock.calls.length >= 1)).toBe(true);
    expect(auth.signupEmail).toHaveBeenCalledWith('a@example.com', 'pw', '127.0.0.1');
    expect(auth.requestLinkPhone).toHaveBeenCalledWith('user-1', '+15551234567', '127.0.0.1');
    expect(auth.me).toHaveBeenCalledWith('user-1');
  });
});
