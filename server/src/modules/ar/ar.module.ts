import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ARController } from './ar.controller.js';
import { ARService } from './ar.service.js';

@Module({ imports: [AuthModule], controllers: [ARController], providers: [ARService] })
export class ARModule {}
