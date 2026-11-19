import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import {
  GeneralSettingsController,
  GeneralSettingsService,
} from './general-settings.controller.js';

describe('general settings API', () => {
  const current = { policies: [], orderFormat: null };
  const settings = { get: vi.fn(() => current), save: vi.fn(() => current) };
  let app: INestApplication;

  beforeAll(async () => {
    const allow = { canActivate: () => true };
    const module = await Test.createTestingModule({
      controllers: [GeneralSettingsController],
      providers: [{ provide: GeneralSettingsService, useValue: settings }],
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

  it('exposes settings and validates policy-only and numbering-only updates', async () => {
    await request(app.getHttpServer())
      .get('/admin/general-settings')
      .expect(200, current);
    const policies = [{ key: 'policy_shipping', value: 'Shipping details' }];
    await request(app.getHttpServer())
      .put('/admin/general-settings')
      .send({ policies })
      .expect(200);
    expect(settings.save).toHaveBeenLastCalledWith({ policies });
    const orderFormat = { prefix: 'NST-', suffix: '-BD', startNumber: 1001 };
    await request(app.getHttpServer())
      .put('/admin/general-settings')
      .send({ orderFormat })
      .expect(200);
    expect(settings.save).toHaveBeenLastCalledWith({
      orderFormat,
      policies: [],
    });
  });

  it('rejects duplicate policies and an invalid starting number before saving', async () => {
    settings.save.mockClear();
    const policies = [
      { key: 'policy_shipping', value: 'First draft' },
      { key: 'policy_shipping', value: 'Second draft' },
    ];
    await request(app.getHttpServer())
      .put('/admin/general-settings')
      .send({ policies })
      .expect(400);
    await request(app.getHttpServer())
      .put('/admin/general-settings')
      .send({ orderFormat: { prefix: 'NST-', suffix: '', startNumber: 0 } })
      .expect(400);
    expect(settings.save).not.toHaveBeenCalled();
  });
});
