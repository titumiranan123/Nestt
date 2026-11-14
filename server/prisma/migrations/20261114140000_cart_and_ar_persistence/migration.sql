-- Persist signed-in carts, AR product assets, and room designs.
CREATE TABLE "cart_items" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cart_items_user_id_variant_id_key"
  ON "cart_items"("user_id", "variant_id");
CREATE INDEX "cart_items_variant_id_idx" ON "cart_items"("variant_id");
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ar_product_assets" (
  "id" UUID NOT NULL,
  "variantId" UUID NOT NULL,
  "modelUrl" TEXT NOT NULL,
  "dimensionsMm" JSONB NOT NULL,
  "placement" TEXT NOT NULL,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ar_product_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ar_product_assets_variantId_key"
  ON "ar_product_assets"("variantId");
ALTER TABLE "ar_product_assets"
  ADD CONSTRAINT "ar_product_assets_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ar_designs" (
  "id" UUID NOT NULL,
  "user_id" UUID,
  "share_id" VARCHAR(64) NOT NULL,
  "title" VARCHAR(120) NOT NULL,
  "room" JSONB NOT NULL,
  "edit_token_hash" CHAR(64) NOT NULL,
  "share_enabled" BOOLEAN NOT NULL DEFAULT false,
  "screenshot_url" VARCHAR(1000),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ar_designs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ar_designs_share_id_key" ON "ar_designs"("share_id");
CREATE INDEX "ar_designs_user_id_updated_at_idx" ON "ar_designs"("user_id", "updated_at");
CREATE INDEX "ar_designs_share_enabled_idx" ON "ar_designs"("share_enabled");
ALTER TABLE "ar_designs"
  ADD CONSTRAINT "ar_designs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
