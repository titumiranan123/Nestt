import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { cartItemSchema, updateCartItemSchema } from './dto/cart.schemas.js';
import type { CartItemInput, UpdateCartItemInput } from './dto/cart.schemas.js';
import { CartService } from './cart.service.js';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@Req() req: AuthRequest) { return this.cart.get(req.authUserId); }

  @Post('items')
  add(@Req() req: AuthRequest, @Body(new ZodValidationPipe(cartItemSchema)) body: CartItemInput) {
    return this.cart.add(req.authUserId, body);
  }

  @Patch('items/:variantId')
  update(
    @Req() req: AuthRequest,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body(new ZodValidationPipe(updateCartItemSchema)) body: UpdateCartItemInput,
  ) { return this.cart.update(req.authUserId, variantId, body.quantity); }

  @Delete('items/:variantId')
  remove(@Req() req: AuthRequest, @Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.cart.remove(req.authUserId, variantId);
  }
}
