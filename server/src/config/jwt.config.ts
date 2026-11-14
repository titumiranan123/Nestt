import type { AppConfig } from './env.validation.js';

export function jwtConfig(config: AppConfig) {
  return {
    accessSecret: config.JWT_ACCESS_SECRET,
    refreshSecret: config.JWT_REFRESH_SECRET,
    accessTtlSeconds: 15 * 60,
    refreshTtlSeconds: 30 * 24 * 60 * 60,
  };
}
