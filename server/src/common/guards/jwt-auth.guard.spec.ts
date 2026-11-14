import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { TokenService } from '../../modules/auth/services/token.service.js';

function context(authorization?: string) {
  const request: Record<string, unknown> = {
    headers: authorization ? { authorization } : {},
  };
  return {
    request,
    executionContext: {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext,
  };
}

describe('JwtAuthGuard', () => {
  it('requires a bearer token', async () => {
    const tokens = { accessUser: vi.fn() };
    const guard = new JwtAuthGuard(tokens as unknown as TokenService);
    await expect(guard.canActivate(context().executionContext)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(tokens.accessUser).not.toHaveBeenCalled();
  });

  it('verifies the token and stores the authenticated user id on the request', async () => {
    const tokens = { accessUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', status: 'ACTIVE' }) };
    const guard = new JwtAuthGuard(tokens as unknown as TokenService);
    const { executionContext, request } = context('Bearer access-token');

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
    expect(tokens.accessUser).toHaveBeenCalledWith('access-token');
    expect(request.authUserId).toBe('user-1');
    expect(request.authUserRole).toBe('CUSTOMER');
  });

  it('rejects suspended and banned accounts', async () => {
    const tokens = { accessUser: vi.fn().mockResolvedValue({ id: 'user-1', role: 'ADMIN', status: 'SUSPENDED' }) };
    const guard = new JwtAuthGuard(tokens as unknown as TokenService);
    await expect(guard.canActivate(context('Bearer access-token').executionContext)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects malformed authorization headers and propagates token failures', async () => {
    const tokens = { accessUser: vi.fn().mockRejectedValue(new UnauthorizedException()) };
    const guard = new JwtAuthGuard(tokens as unknown as TokenService);
    await expect(guard.canActivate(context('Basic token').executionContext)).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(guard.canActivate(context('Bearer invalid').executionContext)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
