CREATE TABLE "order_number_settings" (
    "id" INTEGER PRIMARY KEY CHECK ("id" = 1),
    "prefix" VARCHAR(10) NOT NULL,
    "suffix" VARCHAR(10) NOT NULL,
    "start_number" INTEGER NOT NULL CHECK ("start_number" BETWEEN 1 AND 999999999),
    "next_number" BIGINT NOT NULL CHECK ("next_number" > 0)
);

CREATE TABLE "order_checkout_keys" (
    "key" VARCHAR(30) PRIMARY KEY,
    "order_id" UUID NOT NULL,
    CONSTRAINT "order_checkout_keys_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "order_checkout_keys_order_id_key" ON "order_checkout_keys"("order_id");
