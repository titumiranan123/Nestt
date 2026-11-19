import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { DeliveryAdminController } from './delivery-admin.controller.js';
import { DeliveryLocationService } from './delivery-location.service.js';
import { OrdersService } from './orders.service.js';

describe('delivery admin routes', () => {
  const thanaId = '1891571d-2e58-4fa8-854d-5367f6a7bee4';
  const locations = {
    bulkUpdateThanas: vi.fn(() => ({ updatedCount: 1 })),
    updateThana: vi.fn(() => ({ id: thanaId })),
  };
  const orders = { saveDeliveryZoneConfig: vi.fn((input: unknown) => input) };
  let app: INestApplication;

  beforeAll(async () => {
    const allow = { canActivate: () => true };
    const module = await Test.createTestingModule({
      controllers: [DeliveryAdminController],
      providers: [
        { provide: OrdersService, useValue: orders },
        { provide: DeliveryLocationService, useValue: locations },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(allow)
      .overrideGuard(RolesGuard)
      .useValue(allow)
      .overrideGuard(PermissionsGuard)
      .useValue(allow)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('routes bulk changes before individual thana updates and preserves false', async () => {
    const body = { thanaIds: [thanaId], isDeliverable: false };
    await request(app.getHttpServer())
      .patch('/admin/delivery/thanas/bulk')
      .send(body)
      .expect(200, { updatedCount: 1 });
    expect(locations.bulkUpdateThanas).toHaveBeenCalledWith(body);
  });

  it('passes explicit null fee amounts through to the thana update', async () => {
    const body = { shippingFee: null, freeDeliveryAbove: null };
    await request(app.getHttpServer())
      .patch(`/admin/delivery/thanas/${thanaId}`)
      .send(body)
      .expect(200);
    expect(locations.updateThana).toHaveBeenCalledWith(thanaId, body);
  });

  it('accepts missing ETA values and rejects reversed ETA ranges', async () => {
    const base = {
      zone: 'OUTSIDE_DHAKA',
      flatFee: '120',
      isFree: false,
      isActive: true,
    };
    const body = { ...base, estimatedDaysMin: null, estimatedDaysMax: null };
    await request(app.getHttpServer())
      .put('/admin/delivery/zone-configs')
      .send(body)
      .expect(200, body);
    await request(app.getHttpServer())
      .put('/admin/delivery/zone-configs')
      .send({ ...base, estimatedDaysMin: 5, estimatedDaysMax: 2 })
      .expect(400);
    expect(orders.saveDeliveryZoneConfig).toHaveBeenCalledExactlyOnceWith(body);
  });
});
