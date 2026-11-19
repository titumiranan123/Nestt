import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service.js';
import { PaymentConfigRepository } from './payment-config.repository.js';

describe('PaymentConfigRepository', () => {
  function setup() {
    const tx = {
      paymentConfig: { upsert: vi.fn() },
      sSLConfig: { upsert: vi.fn(), update: vi.fn() },
    };
    const db = {
      $transaction: vi.fn((run: (client: typeof tx) => unknown) => run(tx)),
    };
    return {
      tx,
      repository: new PaymentConfigRepository(db as unknown as PrismaService),
    };
  }

  it('creates a disabled config by default with both encrypted credentials', async () => {
    const { tx, repository } = setup();
    await repository.saveSsl({
      storeId: 'encrypted-id',
      storePass: 'encrypted-password',
    });
    expect(tx.sSLConfig.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          storeId: 'encrypted-id',
          storePass: 'encrypted-password',
          status: false,
        }),
        select: { status: true, updatedAt: true },
      }),
    );
  });

  it('updates only submitted fields so a concurrent credential save cannot be overwritten by a status toggle', async () => {
    const { tx, repository } = setup();
    await repository.saveSsl({ status: false });
    expect(tx.sSLConfig.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: false } }),
    );
    expect(tx.sSLConfig.upsert).not.toHaveBeenCalled();
  });

  it('requires both credential fields for the initial save', async () => {
    const { tx, repository } = setup();
    tx.sSLConfig.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('missing row', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );
    await expect(repository.saveSsl({ status: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
