import { describe, expect, it } from 'vitest';
import { databaseConfig } from './database.config.js';
import { jwtConfig } from './jwt.config.js';
import type { AppConfig } from './env.validation.js';

describe('configuration helpers', () => {
  it('provides the Prisma datasource URL', () => {
    expect(
      databaseConfig({ DATABASE_URL: 'postgresql://db' } as AppConfig),
    ).toEqual({ url: 'postgresql://db' });
  });

  it('returns the configured JWT secrets and token lifetimes', () => {
    expect(
      jwtConfig({
        JWT_ACCESS_SECRET: 'access',
        JWT_REFRESH_SECRET: 'refresh',
      } as AppConfig),
    ).toEqual({
      accessSecret: 'access',
      refreshSecret: 'refresh',
      accessTtlSeconds: 900,
      refreshTtlSeconds: 2_592_000,
    });
  });
});
