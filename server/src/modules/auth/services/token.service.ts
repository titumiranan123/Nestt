import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { z } from 'zod';
import { AppConfigService } from '../../../config/app.config.js';
import { jwtConfig } from '../../../config/jwt.config.js';
import { AuthCrypto } from './auth-crypto.service.js';
import { AuthRepository } from '../auth.repository.js';
import { RedisAuthStore } from '../redis-auth-store.service.js';

const tokenClaims = z.object({
  sub: z.uuid(),
  jti: z.uuid(),
  ver: z.number().int().min(0),
  typ: z.enum(['access', 'refresh']),
});
type Claims = z.infer<typeof tokenClaims>;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly crypto: AuthCrypto,
    private readonly repo: AuthRepository,
    private readonly redis: RedisAuthStore,
  ) {}

  private sign(claims: Claims, kind: 'access' | 'refresh') {
    return this.jwt.signAsync(claims, {
      secret:
        kind === 'access'
          ? jwtConfig(this.config.values).accessSecret
          : jwtConfig(this.config.values).refreshSecret,
      algorithm: 'HS256',
      issuer: 'nestt-server',
      audience: 'nestt-client',
      expiresIn:
        kind === 'access'
          ? jwtConfig(this.config.values).accessTtlSeconds
          : jwtConfig(this.config.values).refreshTtlSeconds,
    });
  }

  private async verify(
    token: string,
    kind: 'access' | 'refresh',
  ): Promise<Claims> {
    try {
      const payload: unknown = await this.jwt.verifyAsync(token, {
        secret:
          kind === 'access'
            ? jwtConfig(this.config.values).accessSecret
            : jwtConfig(this.config.values).refreshSecret,
        algorithms: ['HS256'],
        issuer: 'nestt-server',
        audience: 'nestt-client',
      });
      const claims = tokenClaims.parse(payload);
      if (claims.typ !== kind) throw new Error('Wrong token type');
      return claims;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async accessUser(token: string): Promise<User> {
    const claims = await this.verify(token, 'access');
    const active = await this.redis.isAccessActive(
      claims.jti,
      claims.sub,
      claims.ver,
    );
    if (!active) throw new UnauthorizedException('Invalid or expired token');
    const user = await this.repo.userById(claims.sub);
    if (!user || user.authVersion !== claims.ver || user.status !== 'ACTIVE')
      throw new UnauthorizedException('Invalid or expired token');
    return user;
  }

  async issue(user: User) {
    const { accessTtlSeconds, refreshTtlSeconds } = jwtConfig(
      this.config.values,
    );
    const accessId = this.crypto.newId();
    const refreshId = this.crypto.newId();
    const familyId = this.crypto.newId();
    const accessToken = await this.sign(
      { sub: user.id, jti: accessId, ver: user.authVersion, typ: 'access' },
      'access',
    );
    const refreshToken = await this.sign(
      { sub: user.id, jti: refreshId, ver: user.authVersion, typ: 'refresh' },
      'refresh',
    );
    await this.redis.createSession(
      refreshId,
      familyId,
      user.id,
      user.authVersion,
      this.crypto.tokenHash(refreshToken),
      accessId,
      accessTtlSeconds,
      refreshTtlSeconds,
    );
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTtlSeconds,
    };
  }

  async refresh(token: string) {
    const { accessTtlSeconds, refreshTtlSeconds } = jwtConfig(
      this.config.values,
    );
    const claims = await this.verify(token, 'refresh');
    const user = await this.repo.userById(claims.sub);
    if (!user || user.authVersion !== claims.ver || user.status !== 'ACTIVE')
      throw new UnauthorizedException('Invalid or expired token');
    const nextId = this.crypto.newId();
    const accessId = this.crypto.newId();
    const refreshToken = await this.sign(
      { sub: user.id, jti: nextId, ver: user.authVersion, typ: 'refresh' },
      'refresh',
    );
    const accessToken = await this.sign(
      {
        sub: user.id,
        jti: accessId,
        ver: user.authVersion,
        typ: 'access',
      },
      'access',
    );
    const rotated = await this.redis.rotateSession(
      claims.jti,
      user.id,
      this.crypto.tokenHash(token),
      nextId,
      this.crypto.tokenHash(refreshToken),
      accessId,
      user.authVersion,
      accessTtlSeconds,
      refreshTtlSeconds,
    );
    if (!rotated)
      throw new UnauthorizedException('Invalid or reused refresh token');
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessTtlSeconds,
    };
  }

  async logout(token: string): Promise<void> {
    const claims = await this.verify(token, 'refresh');
    await this.redis.revokeSession(claims.jti, claims.sub);
  }
}
