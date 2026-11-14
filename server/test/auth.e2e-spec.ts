import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard.js';
import { TokenService } from '../src/modules/auth/services/token.service.js';

describe('Auth HTTP contracts', () => {
  let app: INestApplication<App>;
  const auth = {
    requestPhone: vi.fn(async () => ({
      message: 'If eligible, a code has been sent.',
    })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        JwtAuthGuard,
        { provide: AuthService, useValue: auth },
        { provide: TokenService, useValue: { accessUser: vi.fn() } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects malformed input before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/auth/phone/request-otp')
      .send({ phone: '01712345678' })
      .expect(400);
    expect(auth.requestPhone).not.toHaveBeenCalled();
  });

  it('requires an access token for account linking', async () => {
    await request(app.getHttpServer())
      .post('/auth/link/email/request')
      .send({ email: 'a@example.com' })
      .expect(401);
  });

  it('accepts a valid OTP request', async () => {
    await request(app.getHttpServer())
      .post('/auth/phone/request-otp')
      .send({ phone: '+8801712345678' })
      .expect(202);
    expect(auth.requestPhone).toHaveBeenCalledWith(
      '+8801712345678',
      expect.any(String),
    );
  });
});
