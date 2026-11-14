import type { AppConfig } from './env.validation.js';

export function databaseConfig(config: AppConfig) {
  return { url: config.DATABASE_URL };
}
