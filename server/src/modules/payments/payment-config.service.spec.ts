import { ConflictException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import { PaymentConfigCryptoService } from './payment-config-crypto.service.js';
import { PaymentConfigRepository } from './payment-config.repository.js';
import { PaymentConfigService } from './payment-config.service.js';

function setup() {
  const repository = {
    getAll: vi.fn(),
    getBkash: vi.fn(),
    getNagad: vi.fn(),
    getSsl: vi.fn(),
    getBkashAuth: vi.fn(),
    saveBkashAuth: vi.fn(),
    saveBkash: vi.fn(),
    saveNagad: vi.fn(),
    saveSsl: vi.fn(),
  };
  const crypto = {
    encrypt: vi.fn((value: string) => `enc:${value}`),
    decrypt: vi.fn((value: string) => value.replace('enc:', '')),
  };
  return {
    service: new PaymentConfigService(
      repository as unknown as PaymentConfigRepository,
      crypto as unknown as PaymentConfigCryptoService,
    ),
    repository,
    crypto,
  };
}

describe('PaymentConfigService', () => {
  it('returns provider settings without returning encrypted or plaintext secrets', async () => {
    const { service, repository } = setup();
    repository.getAll.mockResolvedValue({
      bkash: {
        baseUrl: 'https://b.example',
        username: 'user',
        password: 'enc:private',
        appKey: 'enc:key',
        appSecret: 'enc:secret',
        status: true,
        updatedAt: new Date(),
      },
      nagad: {
        url: 'https://n.example',
        merchantId: 'm',
        merchantNumber: null,
        apiPrivateKey: 'enc:private',
        apiPublicKey: 'enc:public',
        isActive: false,
        updatedAt: new Date(),
      },
      ssl: {
        storeId: 'store',
        storePass: 'enc:password',
        status: false,
        updatedAt: new Date(),
      },
    });

    const result = await service.getSettings();
    expect(result.bkash).not.toHaveProperty('password');
    expect(result.bkash).not.toHaveProperty('appKey');
    expect(result.nagad).not.toHaveProperty('apiPrivateKey');
    expect(result.ssl).not.toHaveProperty('storePass');
  });

  it('returns an empty settings view before the first provider is configured', async () => {
    const { service, repository } = setup();
    repository.getAll.mockResolvedValue(null);
    await expect(service.getSettings()).resolves.toEqual({
      bkash: null,
      nagad: null,
      ssl: null,
    });
  });

  it('creates provider configs encrypted and preserves secrets when omitted on update', async () => {
    const { service, repository, crypto } = setup();
    repository.getBkash.mockResolvedValueOnce(null).mockResolvedValueOnce({
      baseUrl: 'https://old.example',
      username: 'enc:old-user',
      password: 'enc:old-pass',
      appKey: 'enc:old-key',
      appSecret: 'enc:old-secret',
      status: false,
    });
    const saved = {
      baseUrl: 'https://b.example',
      username: 'user',
      password: 'enc:new-pass',
      appKey: 'enc:key',
      appSecret: 'enc:secret',
      status: true,
      updatedAt: new Date(),
    };
    repository.saveBkash.mockResolvedValue(saved);
    const response = await service.saveBkash({
      baseUrl: 'https://b.example',
      username: 'user',
      password: 'new-pass',
      appKey: 'key',
      appSecret: 'secret',
      status: true,
    });
    expect(response).not.toHaveProperty('username');
    expect(repository.saveBkash).toHaveBeenLastCalledWith({
      baseUrl: 'https://b.example',
      username: 'enc:user',
      password: 'enc:new-pass',
      appKey: 'enc:key',
      appSecret: 'enc:secret',
      status: true,
    });
    await service.saveBkash({ status: true });
    expect(repository.saveBkash).toHaveBeenLastCalledWith({
      baseUrl: 'https://old.example',
      username: 'enc:old-user',
      password: 'enc:old-pass',
      appKey: 'enc:old-key',
      appSecret: 'enc:old-secret',
      status: true,
    });

    repository.getNagad.mockResolvedValue(null);
    repository.saveNagad.mockImplementation(async (data) => ({
      ...data,
      updatedAt: new Date(),
    }));
    await service.saveNagad({
      url: 'https://n.example',
      merchantId: 'merchant',
      apiPrivateKey: 'private',
      apiPublicKey: 'public',
    });
    expect(repository.saveNagad).toHaveBeenCalledWith(
      expect.objectContaining({
        merchantId: 'enc:merchant',
        apiPrivateKey: 'enc:private',
        apiPublicKey: 'enc:public',
        merchantNumber: null,
      }),
    );

    repository.getSsl.mockResolvedValue(null);
    repository.saveSsl.mockImplementation(async (data) => ({
      ...data,
      updatedAt: new Date(),
    }));
    await service.saveSsl({ storeId: 'store', storePass: 'pass' });
    expect(repository.saveSsl).toHaveBeenCalledWith({
      storeId: 'enc:store',
      storePass: 'enc:pass',
      status: false,
    });
    expect(crypto.encrypt).toHaveBeenCalled();
  });

  it('requires all credentials when initially configuring a provider', async () => {
    const { service, repository } = setup();
    repository.getBkash.mockResolvedValue(null);
    await expect(service.saveBkash({ status: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
    repository.getNagad.mockResolvedValue(null);
    await expect(
      service.saveNagad({ url: 'https://n.example' }),
    ).rejects.toBeInstanceOf(ConflictException);
    repository.getSsl.mockResolvedValue(null);
    await expect(service.saveSsl({ status: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('requires an omitted secret when an existing config has no encrypted value', async () => {
    const { service, repository } = setup();
    repository.getBkash.mockResolvedValue({
      baseUrl: 'https://b.example',
      username: 'user',
      status: false,
    });
    await expect(service.saveBkash({})).rejects.toThrow('password is required');
    repository.getNagad.mockResolvedValue({
      url: 'https://n.example',
      merchantId: 'merchant',
      isActive: false,
    });
    await expect(service.saveNagad({})).rejects.toThrow(
      'apiPrivateKey is required',
    );
    repository.getSsl.mockResolvedValue({ storeId: 'store', status: false });
    await expect(service.saveSsl({})).rejects.toThrow('storePass is required');
  });

  it('returns gateway credentials only for enabled providers', async () => {
    const { service, repository, crypto } = setup();
    repository.getBkash.mockResolvedValue({
      baseUrl: 'https://b.example',
      username: 'u',
      password: 'enc:p',
      appKey: 'enc:k',
      appSecret: 'enc:s',
      status: true,
    });
    await expect(
      service.getGatewayCredentials(PaymentMethod.BKASH),
    ).resolves.toMatchObject({ password: 'p', appKey: 'k', appSecret: 's' });
    repository.getNagad.mockResolvedValue({
      url: 'https://n.example',
      merchantId: 'm',
      merchantNumber: '01',
      apiPrivateKey: 'enc:p',
      apiPublicKey: 'enc:k',
      isActive: true,
    });
    await expect(
      service.getGatewayCredentials(PaymentMethod.NAGAD),
    ).resolves.toMatchObject({ apiPrivateKey: 'p', apiPublicKey: 'k' });
    repository.getSsl.mockResolvedValue({
      storeId: 's',
      storePass: 'enc:p',
      status: true,
    });
    await expect(
      service.getGatewayCredentials(PaymentMethod.SSL_COMMERZ),
    ).resolves.toEqual({ storeId: 's', storePass: 'p' });
    repository.getBkash.mockResolvedValue({ status: false });
    await expect(
      service.getGatewayCredentials(PaymentMethod.BKASH),
    ).rejects.toBeInstanceOf(ConflictException);
    repository.getNagad.mockResolvedValue({ isActive: false });
    await expect(
      service.getGatewayCredentials(PaymentMethod.NAGAD),
    ).rejects.toBeInstanceOf(ConflictException);
    repository.getSsl.mockResolvedValue({ status: false });
    await expect(
      service.getGatewayCredentials(PaymentMethod.SSL_COMMERZ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.getGatewayCredentials(PaymentMethod.CASH_ON_DELIVERY),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(crypto.decrypt).toHaveBeenCalled();
  });

  it('encrypts bKash auth tokens at rest and decrypts them only for internal use', async () => {
    const { service, repository } = setup();
    repository.getBkash.mockResolvedValue({ id: 'bkash-config' });
    repository.saveBkashAuth.mockResolvedValue({});
    const expiresAt = new Date('2026-10-28T12:00:00.000Z');
    await expect(
      service.saveBkashAuthToken('access-token', expiresAt),
    ).resolves.toEqual({ expiresAt });
    expect(repository.saveBkashAuth).toHaveBeenCalledWith({
      token: 'enc:access-token',
      exp: expiresAt,
    });

    repository.getBkashAuth.mockResolvedValue({
      token: 'enc:access-token',
      exp: expiresAt,
    });
    await expect(service.getBkashAuthToken()).resolves.toEqual({
      token: 'access-token',
      expiresAt,
    });
    repository.getBkashAuth.mockResolvedValue(null);
    await expect(service.getBkashAuthToken()).resolves.toBeNull();
    repository.getBkash.mockResolvedValue(null);
    await expect(
      service.saveBkashAuthToken('access-token', expiresAt),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
