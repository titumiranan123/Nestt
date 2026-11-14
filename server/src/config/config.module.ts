import { Global, Module } from '@nestjs/common';
import { AppConfigService } from './app.config.js';

@Global()
@Module({ providers: [AppConfigService], exports: [AppConfigService] })
export class ConfigModule {}
