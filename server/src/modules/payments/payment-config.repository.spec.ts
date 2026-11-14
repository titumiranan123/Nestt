import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../database/prisma.service.js';
import { PaymentConfigRepository } from './payment-config.repository.js';

function createRepository(tx: Record<string, unknown>) {
  const reads = {
    paymentConfig: vi.fn().mockResolvedValue(null),
    bkash: vi.fn().mockResolvedValue(null),
    nagad: vi.fn().mockResolvedValue(null),
    ssl: vi.fn().mockResolvedValue(null),
    bkashAuth: vi.fn().mockResolvedValue(null),
    saveBkashAuth: vi.fn().mockResolvedValue({ id: 'auth' }),
  };
  const db = {
    paymentConfig: { findUnique: reads.paymentConfig },
    bkashConfig: { findUnique: reads.bkash },
    nagadConfig: { findUnique: reads.nagad },
    sSLConfig: { findUnique: reads.ssl },
    bkashAuth: { findUnique: reads.bkashAuth, upsert: reads.saveBkashAuth },
    $transaction: vi.fn((callback: (client: unknown) => unknown) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  return { repository: new PaymentConfigRepository(db), db, reads };
}

describe('PaymentConfigRepository', () => {
  it('reads provider configuration using the singleton config id', async () => {
    const { repository } = createRepository({});

    await expect(repository.getAll()).resolves.toBeNull();
    await expect(repository.getBkash()).resolves.toBeNull();
    await expect(repository.getNagad()).resolves.toBeNull();
    await expect(repository.getSsl()).resolves.toBeNull();
    await expect(repository.getBkashAuth()).resolves.toBeNull();
  });

  it('upserts the singleton and each provider in one transaction', async () => {
    const tx = {
      paymentConfig: { upsert: vi.fn().mockResolvedValue({}) },
      bkashConfig: { upsert: vi.fn().mockResolvedValue({ id: 'bkash' }) },
      nagadConfig: { upsert: vi.fn().mockResolvedValue({ id: 'nagad' }) },
      sSLConfig: { upsert: vi.fn().mockResolvedValue({ id: 'ssl' }) },
    };
    const { repository } = createRepository(tx);
    const bkash = {
      baseUrl: 'https://b.example',
      username: 'user',
      password: 'enc',
      appKey: 'enc',
      appSecret: 'enc',
      status: false,
    };
    const nagad = {
      url: 'https://n.example',
      merchantId: 'merchant',
      apiPrivateKey: 'enc',
      apiPublicKey: 'enc',
      merchantNumber: null,
      isActive: false,
    };
    const ssl = { storeId: 'store', storePass: 'enc', status: false };

    await expect(repository.saveBkash(bkash)).resolves.toEqual({ id: 'bkash' });
    await expect(repository.saveNagad(nagad)).resolves.toEqual({ id: 'nagad' });
    await expect(repository.saveSsl(ssl)).resolves.toEqual({ id: 'ssl' });
    expect(tx.paymentConfig.upsert).toHaveBeenCalledTimes(3);
    expect(tx.bkashConfig.upsert).toHaveBeenCalledWith({
      where: { paymentConfigId: '00000000-0000-4000-8000-000000000002' },
      create: {
        ...bkash,
        paymentConfigId: '00000000-0000-4000-8000-000000000002',
      },
      update: bkash,
    });
    expect(tx.nagadConfig.upsert).toHaveBeenCalledTimes(1);
    expect(tx.sSLConfig.upsert).toHaveBeenCalledTimes(1);
    const { repository: authRepository, reads } = createRepository({});
    await expect(
      authRepository.saveBkashAuth({ token: 'enc:token', exp: new Date() }),
    ).resolves.toEqual({ id: 'auth' });
    expect(reads.saveBkashAuth).toHaveBeenCalledWith({
      where: { bkashConfigId: '00000000-0000-4000-8000-000000000002' },
      create: {
        token: 'enc:token',
        exp: expect.any(Date),
        bkashConfigId: '00000000-0000-4000-8000-000000000002',
      },
      update: { token: 'enc:token', exp: expect.any(Date) },
    });
  });
});
