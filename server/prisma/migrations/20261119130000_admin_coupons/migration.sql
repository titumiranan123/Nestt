CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "discount_type" "CouponDiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order" DECIMAL(12,2),
    "max_discount" DECIMAL(12,2),
    "expires_at" TIMESTAMP(6),
    "usage_limit" INTEGER,
    "user_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
CREATE INDEX "coupons_is_active_expires_at_idx" ON "coupons"("is_active", "expires_at");
