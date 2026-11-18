CREATE TABLE "product_care_items" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_care_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_care_items_productId_idx" ON "product_care_items"("productId");

ALTER TABLE "product_care_items"
ADD CONSTRAINT "product_care_items_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
