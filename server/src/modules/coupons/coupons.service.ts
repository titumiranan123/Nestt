import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { CouponInput, CouponUpdate } from './coupons.schemas.js';

type CouponRow = {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrder: number | null;
  maxDiscount: number | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  userLimit: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const couponColumns = Prisma.sql`
  id::text AS id, code, discount_type::text AS "discountType",
  discount_value::float8 AS "discountValue", min_order::float8 AS "minOrder",
  max_discount::float8 AS "maxDiscount", expires_at AS "expiresAt",
  usage_limit AS "usageLimit", user_limit AS "userLimit", used_count AS "usedCount",
  is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
`;

@Injectable()
export class CouponsService {
  constructor(private readonly db: PrismaService) {}

  async list() {
    const rows = await this.db.$queryRaw<CouponRow[]>(Prisma.sql`
      SELECT ${couponColumns} FROM coupons ORDER BY created_at DESC, code ASC
    `);
    return rows.map((row) => this.present(row));
  }

  async create(input: CouponInput) {
    try {
      const rows = await this.db.$queryRaw<CouponRow[]>(Prisma.sql`
        INSERT INTO coupons (id, code, discount_type, discount_value, min_order, max_discount,
          expires_at, usage_limit, user_limit, is_active, created_at, updated_at)
        VALUES (${randomUUID()}::uuid, ${input.code}, ${input.discountType}::"CouponDiscountType",
          ${input.discountValue}, ${input.minOrder}, ${input.maxDiscount}, ${input.expiresAt},
          ${input.usageLimit}, ${input.userLimit}, ${input.isActive}, NOW(), NOW())
        RETURNING ${couponColumns}
      `);
      return this.present(rows[0]);
    } catch (error) {
      if (this.isDuplicateCode(error)) throw new ConflictException('A coupon with this code already exists.');
      throw error;
    }
  }

  async update(id: string, input: CouponUpdate) {
    const currentRows = await this.db.$queryRaw<CouponRow[]>(Prisma.sql`
      SELECT ${couponColumns} FROM coupons WHERE id = ${id}::uuid
    `);
    const current = currentRows[0];
    if (!current) throw new NotFoundException('Coupon not found.');
    const coupon = { ...current, ...input };
    if (coupon.discountType === 'FIXED') coupon.maxDiscount = null;

    try {
      const rows = await this.db.$queryRaw<CouponRow[]>(Prisma.sql`
        UPDATE coupons SET code = ${coupon.code}, discount_type = ${coupon.discountType}::"CouponDiscountType",
          discount_value = ${coupon.discountValue}, min_order = ${coupon.minOrder},
          max_discount = ${coupon.maxDiscount}, expires_at = ${coupon.expiresAt},
          usage_limit = ${coupon.usageLimit}, user_limit = ${coupon.userLimit},
          is_active = ${coupon.isActive}, updated_at = NOW()
        WHERE id = ${id}::uuid RETURNING ${couponColumns}
      `);
      if (!rows[0]) throw new NotFoundException('Coupon not found.');
      return this.present(rows[0]);
    } catch (error) {
      if (this.isDuplicateCode(error)) throw new ConflictException('A coupon with this code already exists.');
      throw error;
    }
  }

  async remove(id: string) {
    const rows = await this.db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM coupons WHERE id = ${id}::uuid RETURNING id::text AS id
    `);
    if (!rows[0]) throw new NotFoundException('Coupon not found.');
    return { id: rows[0].id, deleted: true };
  }

  private present(coupon: CouponRow) {
    return { ...coupon, expiresAt: coupon.expiresAt?.toISOString() ?? null, createdAt: coupon.createdAt.toISOString(), updatedAt: coupon.updatedAt.toISOString() };
  }

  private isDuplicateCode(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
