import { Test, TestingModule } from '@nestjs/testing';
import { PATH_METADATA } from '@nestjs/common/constants';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('returns the healthy status payload', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
      expect(
        Reflect.getMetadata(
          PATH_METADATA,
          Object.getOwnPropertyDescriptor(AppController.prototype, 'getHealth')
            ?.value,
        ),
      ).toBe('health');
    });
  });
});
