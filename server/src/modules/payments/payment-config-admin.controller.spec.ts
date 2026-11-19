import { describe, expect, it, vi } from 'vitest';
import { PaymentConfigAdminController } from './payment-config-admin.controller.js';
import type { PaymentConfigService } from './payment-config.service.js';

describe('PaymentConfigAdminController', () => {
  it('forwards SSLCommerz settings operations to the service', async () => {
    const service = {
      getSettings: vi.fn().mockResolvedValue({}),
      saveSsl: vi.fn().mockResolvedValue({ status: true }),
    };
    const controller = new PaymentConfigAdminController(
      service as unknown as PaymentConfigService,
    );

    await expect(controller.getSettings()).resolves.toEqual({});
    await expect(controller.saveSsl({ status: true })).resolves.toEqual({
      status: true,
    });
    expect(service.saveSsl).toHaveBeenCalledWith({ status: true });
  });
});
