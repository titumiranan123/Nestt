import { ConflictException } from '@nestjs/common';
import type { PaymentConfigCryptoService } from './payment-config-crypto.service.js';
import type { PaymentConfigRepository } from './payment-config.repository.js';
import { PaymentConfigService } from './payment-config.service.js';

describe('PaymentConfigService', () => {
  const updatedAt = new Date('2026-11-19T00:00:00Z');

  function setup() {
    const repository = { getAll: vi.fn(), getSsl: vi.fn(), saveSsl: vi.fn() };
    const crypto = {
      encrypt: vi.fn((value: string) => `encrypted:${value}`),
      decrypt: vi.fn((value: string) => value.replace('encrypted:', '')),
    };
    const service = new PaymentConfigService(
      repository as unknown as PaymentConfigRepository,
      crypto as unknown as PaymentConfigCryptoService,
    );
    return { repository, crypto, service };
  }

  it('returns empty or redacted settings', async () => {
    const { repository, service } = setup();
    repository.getAll.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ssl: {
        storeId: 'encrypted:id',
        storePass: 'encrypted:password',
        status: true,
        updatedAt,
      },
    });
    await expect(service.getSettings()).resolves.toEqual({ ssl: null });
    await expect(service.getSettings()).resolves.toEqual({
      ssl: { status: true, credentialsConfigured: true, updatedAt },
    });
  });

  it('encrypts only submitted credentials and never includes them in save responses', async () => {
    const { repository, crypto, service } = setup();
    repository.saveSsl.mockResolvedValue({ status: false, updatedAt });
    await expect(
      service.saveSsl({ storePass: 'new-password' }),
    ).resolves.toEqual({
      status: false,
      credentialsConfigured: true,
      updatedAt,
    });
    expect(repository.saveSsl).toHaveBeenLastCalledWith({
      storePass: 'encrypted:new-password',
    });
    await service.saveSsl({ status: false });
    expect(repository.saveSsl).toHaveBeenLastCalledWith({ status: false });
    expect(crypto.encrypt).toHaveBeenCalledExactlyOnceWith('new-password');
  });

  it('serves credentials internally to checkout and permits validation after the gateway is disabled', async () => {
    const { repository, service } = setup();
    repository.getSsl.mockResolvedValue({
      storeId: 'encrypted:id',
      storePass: 'encrypted:password',
      status: false,
    });
    await expect(
      service.getGatewayCredentials('SSL_COMMERZ'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.getGatewayCredentials('SSL_COMMERZ', true),
    ).resolves.toEqual({ storeId: 'id', storePass: 'password' });
    await expect(
      service.getGatewayCredentials('CASH_ON_DELIVERY'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
