import { Injectable } from '@nestjs/common';
import { AppConfig, validateEnvironment } from './env.validation.js';

@Injectable()
export class AppConfigService {
  readonly values: AppConfig;

  constructor() {
    this.values = validateEnvironment(process.env);
  }
}
