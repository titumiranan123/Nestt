BEGIN;

ALTER TABLE "orders"
  ADD COLUMN "contact_email" VARCHAR(255),
  ADD COLUMN "order_phone_otp_sent_at" TIMESTAMP(6),
  ADD COLUMN "order_phone_verified_at" TIMESTAMP(6);

CREATE TABLE "order_status_emails" (
  "history_id" UUID NOT NULL,
  "recipient" VARCHAR(320) NOT NULL,
  "available_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMP(6),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "order_status_emails_pkey" PRIMARY KEY ("history_id"),
  CONSTRAINT "order_status_emails_history_id_fkey"
    FOREIGN KEY ("history_id") REFERENCES "order_status_histories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "order_status_emails_sent_at_available_at_idx"
  ON "order_status_emails"("sent_at", "available_at");

COMMIT;
