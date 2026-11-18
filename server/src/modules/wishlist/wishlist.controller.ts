import {
  Controller, Delete, Get, HttpCode, NotFoundException, Param,
  ParseUUIDPipe, Put, Req, UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../../common/guards/jwt-auth.guard.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PrismaService } from '../../database/prisma.service.js';

const publishedVariant = {
  status: 'active' as const,
  deletedAt: null,
  product: { is: { status: 'active' as const, deletedAt: null } },
};

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly db: PrismaService) {}

  @Get()
  list(@Req() req: AuthRequest) {
    return this.db.wishlistItem.findMany({
      where: { wishlist: { userId: req.authUserId }, variant: publishedVariant },
      orderBy: { addedAt: 'desc' },
      select: {
        variantId: true,
        variant: {
          select: {
            name: true, price: true, stockQty: true, stockStatus: true,
            media: {
              where: { type: { not: 'video' } },
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
              take: 1,
              select: { url: true },
            },
            product: {
              select: {
                id: true, name: true, isPriceOnRequest: true,
                category: { select: { name: true } },
                variants: {
                  where: { status: 'active', deletedAt: null },
                  orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
                  take: 1,
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });
  }

  @Put('items/:variantId')
  async save(@Req() req: AuthRequest, @Param('variantId', ParseUUIDPipe) variantId: string) {
    await this.db.$transaction(async (tx) => {
      const variant = await tx.productVariant.findFirst({
        where: { id: variantId, ...publishedVariant },
        select: { id: true },
      });
      if (!variant) throw new NotFoundException('Product is no longer available');
      const wishlist = await tx.wishlist.upsert({
        where: { userId: req.authUserId },
        create: { userId: req.authUserId },
        update: { userId: req.authUserId },
        select: { id: true },
      });
      const key = { wishlistId: wishlist.id, variantId };
      await tx.wishlistItem.upsert({
        where: { wishlistId_variantId: key },
        create: key,
        update: { variantId },
      });
    });
    return { variantId };
  }

  @Delete('items/:variantId')
  @HttpCode(204)
  async remove(@Req() req: AuthRequest, @Param('variantId', ParseUUIDPipe) variantId: string) {
    await this.db.wishlistItem.deleteMany({
      where: { variantId, wishlist: { userId: req.authUserId } },
    });
  }
}
