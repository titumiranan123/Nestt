import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TokenService } from './token.service.js';
import type { AppConfigService } from '../../../config/app.config.js';
import type { AuthCrypto } from './auth-crypto.service.js';
import type { AuthRepository } from '../auth.repository.js';

describe('TokenService', () => {
  it('separates access and refresh tokens and honors token-version invalidation', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      authVersion: 0,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    };
    let sequence = 1;
    const crypto = {
      newId: () =>
        `22222222-2222-4222-8222-${String(sequence++).padStart(12, '0')}`,
      tokenHash: (value: string) => value,
    };
    const repo = {
      userById: vi.fn(async (): Promise<typeof user | null> => user),
      createSession: vi.fn(async () => ({})),
    };
    const config = {
      values: {
        JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
        JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
      },
    };
    const jwt = new JwtService();
    const service = new TokenService(
      jwt,
      config as AppConfigService,
      crypto as unknown as AuthCrypto,
      repo as unknown as AuthRepository,
    );
    const issued = await service.issue(user as never);
    expect(issued).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 });
    expect(await service.accessUser(issued.accessToken)).toBe(user);
    await expect(service.accessUser(issued.refreshToken)).rejects.toMatchObject(
      { status: 401 },
    );
    user.authVersion = 1;
    await expect(service.accessUser(issued.accessToken)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('rotates a valid refresh token and revokes it on logout', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      authVersion: 2,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    };
    let sequence = 1;
    const crypto = {
      newId: () =>
        `22222222-2222-4222-8222-${String(sequence++).padStart(12, '0')}`,
      tokenHash: (token: string) => `hash:${token}`,
    };
    const repo = {
      userById: vi.fn(async (): Promise<typeof user | null> => user),
      createSession: vi.fn(async () => ({})),
      rotateSession: vi.fn(async () => user.id),
      revokeSession: vi.fn(async () => ({ count: 1 })),
    };
    const jwt = new JwtService();
    const service = new TokenService(
      jwt,
      {
        values: {
          JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
          JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
        },
      } as AppConfigService,
      crypto as unknown as AuthCrypto,
      repo as unknown as AuthRepository,
    );
    const initial = await service.issue(user as never);

    await expect(service.refresh(initial.refreshToken)).resolves.toMatchObject({
      tokenType: 'Bearer',
      expiresIn: 900,
    });
    expect(repo.rotateSession).toHaveBeenCalledWith(
      expect.any(String),
      `hash:${initial.refreshToken}`,
      expect.any(String),
      expect.stringContaining('hash:'),
      expect.any(Date),
    );
    await expect(service.logout(initial.refreshToken)).resolves.toBeUndefined();
    expect(repo.revokeSession).toHaveBeenCalledWith(
      expect.any(String),
      user.id,
    );
  });

  it('rejects malformed, wrong-type, stale-version, and reused tokens', async () => {
    const user = {
      id: '11111111-1111-4111-8111-111111111111',
      authVersion: 0,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    };
    let sequence = 1;
    const crypto = {
      newId: () =>
        `22222222-2222-4222-8222-${String(sequence++).padStart(12, '0')}`,
      tokenHash: (token: string) => token,
    };
    const repo = {
      userById: vi.fn(async (): Promise<typeof user | null> => user),
      createSession: vi.fn(async () => ({})),
      rotateSession: vi.fn(async () => null),
    };
    const jwt = new JwtService();
    const service = new TokenService(
      jwt,
      {
        values: {
          JWT_ACCESS_SECRET: 'access-secret-with-at-least-32-characters',
          JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
        },
      } as AppConfigService,
      crypto as unknown as AuthCrypto,
      repo as unknown as AuthRepository,
    );
    const issued = await service.issue(user as never);

    await expect(service.accessUser('not-a-jwt')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(issued.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const wrongTypeRefresh = await jwt.signAsync(
      {
        sub: user.id,
        jti: '33333333-3333-4333-8333-333333333333',
        ver: user.authVersion,
        typ: 'access',
      },
      {
        secret: 'refresh-secret-with-at-least-32-characters',
        algorithm: 'HS256',
        issuer: 'nestt-server',
        audience: 'nestt-client',
      },
    );
    await expect(service.refresh(wrongTypeRefresh)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repo.userById.mockResolvedValueOnce(null);
    await expect(service.accessUser(issued.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repo.userById.mockResolvedValueOnce({ ...user, authVersion: 1 } as never);
    await expect(service.accessUser(issued.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repo.userById.mockResolvedValueOnce(null);
    await expect(service.refresh(issued.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    repo.userById.mockResolvedValueOnce({ ...user, authVersion: 1 } as never);
    await expect(service.refresh(issued.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.refresh(issued.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.logout('bad-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
