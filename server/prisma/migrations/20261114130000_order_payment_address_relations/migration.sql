-- Add location references while retaining the order's address text snapshots.
ALTER TABLE "addresses" ADD COLUMN "thana_id" UUID;
ALTER TABLE "orders" ADD COLUMN "shipping_thana_id" UUID;

WITH address_matches AS (
  SELECT
    a."id" AS "address_id",
    t."id" AS "thana_id",
    COUNT(*) OVER (PARTITION BY a."id") AS "match_count"
  FROM "addresses" AS a
  JOIN "thanas" AS t ON LOWER(t."name") = LOWER(a."area")
  JOIN "districts" AS d ON d."id" = t."districtId"
  JOIN "divisions" AS v ON v."id" = d."divisionId"
  WHERE LOWER(d."name") = LOWER(a."city")
    AND LOWER(v."name") = LOWER(a."region")
)
UPDATE "addresses" AS a
SET "thana_id" = m."thana_id"
FROM address_matches AS m
WHERE a."id" = m."address_id" AND m."match_count" = 1;

WITH order_matches AS (
  SELECT
    o."id" AS "order_id",
    t."id" AS "thana_id",
    COUNT(*) OVER (PARTITION BY o."id") AS "match_count"
  FROM "orders" AS o
  JOIN "thanas" AS t ON LOWER(t."name") = LOWER(o."shipping_area")
  JOIN "districts" AS d ON d."id" = t."districtId"
  JOIN "divisions" AS v ON v."id" = d."divisionId"
  WHERE LOWER(d."name") = LOWER(o."shipping_city")
    AND LOWER(v."name") = LOWER(o."shipping_region")
)
UPDATE "orders" AS o
SET "shipping_thana_id" = m."thana_id"
FROM order_matches AS m
WHERE o."id" = m."order_id" AND m."match_count" = 1;

ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_thana_id_fkey"
  FOREIGN KEY ("thana_id") REFERENCES "thanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_shipping_thana_id_fkey"
  FOREIGN KEY ("shipping_thana_id") REFERENCES "thanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "addresses_thana_id_idx" ON "addresses"("thana_id");
CREATE INDEX "orders_shipping_thana_id_idx" ON "orders"("shipping_thana_id");

-- Collapse any legacy multiple-payment orders into one payment, preserving
-- their transaction/refund records under the most recently updated payment.
WITH ranked AS (
  SELECT
    "id",
    "order_id",
    ROW_NUMBER() OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "rank",
    FIRST_VALUE("id") OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "keep_id",
    FIRST_VALUE("status") OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "keep_status"
  FROM "payments"
), duplicates AS (
  SELECT "id", "order_id", "keep_id", "keep_status" FROM ranked WHERE "rank" > 1
)
UPDATE "transactions" AS t
SET "payment_id" = d."keep_id"
FROM duplicates AS d
WHERE t."payment_id" = d."id";

WITH ranked AS (
  SELECT
    "id",
    "order_id",
    ROW_NUMBER() OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "rank",
    FIRST_VALUE("id") OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "keep_id"
  FROM "payments"
), duplicates AS (
  SELECT "id", "order_id", "keep_id" FROM ranked WHERE "rank" > 1
)
UPDATE "refunds" AS r
SET "payment_id" = d."keep_id"
FROM duplicates AS d
WHERE r."payment_id" = d."id";

WITH ranked AS (
  SELECT
    "id",
    "order_id",
    ROW_NUMBER() OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "rank",
    FIRST_VALUE("id") OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "keep_id",
    FIRST_VALUE("status") OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "keep_status"
  FROM "payments"
), selected AS (
  SELECT "order_id", "keep_status" FROM ranked WHERE "rank" = 1
)
UPDATE "orders" AS o
SET "payment_status" = selected."keep_status"
FROM selected
WHERE o."id" = selected."order_id";

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "order_id" ORDER BY "updated_at" DESC, "created_at" DESC, "id") AS "rank"
  FROM "payments"
)
DELETE FROM "payments" AS p
USING ranked
WHERE p."id" = ranked."id" AND ranked."rank" > 1;

CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

CREATE TYPE "TransactionSource" AS ENUM ('SSL_COMMERZ', 'COD_COLLECTION', 'ADMIN_ADJUSTMENT');
ALTER TABLE "transactions"
  ADD COLUMN "source" "TransactionSource" NOT NULL DEFAULT 'SSL_COMMERZ';
UPDATE "transactions" AS t
SET "metadata" = COALESCE(t."metadata", '{}'::jsonb)
    || jsonb_build_object('manualReference', t."gateway_transaction_id"),
    "gateway_transaction_id" = NULL
FROM "payments" AS p
WHERE p."id" = t."payment_id"
  AND t."metadata"->>'source' = 'admin'
  AND t."gateway_transaction_id" IS NOT NULL;
UPDATE "transactions" AS t
SET "source" = CASE
  WHEN p."method" = 'CASH_ON_DELIVERY' THEN 'COD_COLLECTION'::"TransactionSource"
  ELSE 'ADMIN_ADJUSTMENT'::"TransactionSource"
END
FROM "payments" AS p
WHERE p."id" = t."payment_id";
