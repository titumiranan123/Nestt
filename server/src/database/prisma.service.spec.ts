import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from './prisma.service.js';
import type { AppConfigService } from '../config/app.config.js';

describe('PrismaService', () => {
  it('connects and disconnects over the Nest lifecycle', async () => {
    const service = new PrismaService({
      values: { DATABASE_URL: 'postgresql://user:pass@localhost:5432/nestt' },
    } as AppConfigService);
    const connect = vi.spyOn(service, '$connect').mockResolvedValue(undefined);
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
