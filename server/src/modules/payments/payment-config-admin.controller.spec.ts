import { describe, expect, it, vi } from 'vitest';
import { PaymentConfigAdminController } from './payment-config-admin.controller.js';
import type { PaymentConfigService } from './payment-config.service.js';

describe('PaymentConfigAdminController', () => {
  it('forwards validated provider configuration operations to the service', async () => {
    const service = {
      getSettings: vi.fn().mockResolvedValue({}),
      saveBkash: vi.fn().mockResolvedValue({ status: true }),
      saveNagad: vi.fn().mockResolvedValue({ isActive: true }),
      saveSsl: vi.fn().mockResolvedValue({ status: true }),
    };
    const controller = new PaymentConfigAdminController(
      service as unknown as PaymentConfigService,
    );

    await expect(controller.getSettings()).resolves.toEqual({});
    await expect(controller.saveBkash({ status: true })).resolves.toEqual({
      status: true,
    });
    await expect(controller.saveNagad({ isActive: true })).resolves.toEqual({
      isActive: true,
    });
    await expect(controller.saveSsl({ status: true })).resolves.toEqual({
      status: true,
    });
    expect(service.saveBkash).toHaveBeenCalledWith({ status: true });
    expect(service.saveNagad).toHaveBeenCalledWith({ isActive: true });
    expect(service.saveSsl).toHaveBeenCalledWith({ status: true });
  });
});
