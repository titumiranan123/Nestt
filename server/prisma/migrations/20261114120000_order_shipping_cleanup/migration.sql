-- Restrict new payment choices to COD and SSLCommerz while preserving old
-- bKash/Nagad payment records as explicitly retired method labels.
ALTER TABLE "payments"
  ALTER COLUMN "method" TYPE VARCHAR(30)
  USING "method"::text;

UPDATE "payments"
SET "method" = 'LEGACY_' || "method"
WHERE "method" IN ('BKASH', 'NAGAD');

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_method_check"
  CHECK ("method" IN ('CASH_ON_DELIVERY', 'SSL_COMMERZ', 'LEGACY_BKASH', 'LEGACY_NAGAD'));

DROP TYPE "PaymentMethod";
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'SSL_COMMERZ');

-- Courier status history is retained and relabeled as an admin-managed event.
UPDATE "order_status_histories"
SET "source" = 'ADMIN'
WHERE "source" = 'COURIER';

ALTER TABLE "order_status_histories"
  ALTER COLUMN "source" DROP DEFAULT;
ALTER TYPE "TrackingSource" RENAME TO "TrackingSource_old";
CREATE TYPE "TrackingSource" AS ENUM ('SYSTEM', 'ADMIN');
ALTER TABLE "order_status_histories"
  ALTER COLUMN "source" TYPE "TrackingSource"
  USING "source"::text::"TrackingSource";
ALTER TABLE "order_status_histories"
  ALTER COLUMN "source" SET DEFAULT 'SYSTEM'::"TrackingSource";
DROP TYPE "TrackingSource_old";

DROP INDEX "orders_courierProviderId_idx";
DROP INDEX "orders_courierProviderId_courierConsignmentId_idx";
DROP INDEX "orders_courierTrackingCode_idx";
DROP INDEX "orders_courierSubmissionStatus_idx";

ALTER TABLE "orders"
  DROP COLUMN "courierAssignedAt",
  DROP COLUMN "courierConsignmentId",
  DROP COLUMN "courierLastSyncedAt",
  DROP COLUMN "courierStatus",
  DROP COLUMN "courierTrackingCode",
  DROP COLUMN "courierProviderId",
  DROP COLUMN "courierSubmissionStatus";

DROP TYPE "CourierSubmissionStatus";
DROP TYPE "CourierType";
DROP TYPE "CourierProviderCode";

-- Move existing text-based shipping rates into the normalized location tree.
CREATE UNIQUE INDEX "districts_divisionId_name_key" ON "districts"("divisionId", "name");
CREATE UNIQUE INDEX "thanas_districtId_name_key" ON "thanas"("districtId", "name");

INSERT INTO "divisions" ("id", "name")
SELECT gen_random_uuid(), rates."region"
FROM (SELECT DISTINCT "region" FROM "shipping_rates") AS rates
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "districts" ("id", "name", "divisionId")
SELECT gen_random_uuid(), rates."city", divisions."id"
FROM (SELECT DISTINCT "region", "city" FROM "shipping_rates") AS rates
JOIN "divisions" AS divisions ON divisions."name" = rates."region"
ON CONFLICT ("divisionId", "name") DO NOTHING;

INSERT INTO "thanas" ("id", "name", "districtId", "shippingFee", "isDeliverable")
SELECT gen_random_uuid(), rates."area", districts."id", rates."charge", rates."isActive"
FROM "shipping_rates" AS rates
JOIN "divisions" AS divisions ON divisions."name" = rates."region"
JOIN "districts" AS districts
  ON districts."divisionId" = divisions."id"
  AND districts."name" = rates."city"
ON CONFLICT ("districtId", "name") DO UPDATE
SET "shippingFee" = EXCLUDED."shippingFee",
    "isDeliverable" = EXCLUDED."isDeliverable";

DROP TABLE "shipping_rates";
