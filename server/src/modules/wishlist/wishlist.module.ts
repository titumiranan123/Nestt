import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { WishlistController } from './wishlist.controller.js';

@Module({ imports: [AuthModule], controllers: [WishlistController] })
export class WishlistModule {}
