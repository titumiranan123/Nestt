ALTER TABLE "users"
ADD COLUMN "customerLocation" VARCHAR(255),
ADD COLUMN "customerDeletedAt" TIMESTAMP(3);

CREATE TABLE "customer_avatars" (
    "userId" UUID NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "bytes" BYTEA NOT NULL,
    CONSTRAINT "customer_avatars_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "customer_avatars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TYPE "MediaUploadKind" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "media_uploads" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "kind" "MediaUploadKind" NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(32) NOT NULL,
    "size" INTEGER NOT NULL,
    "batchId" UUID,
    "position" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_uploads_ownerId_batchId_position_key" ON "media_uploads"("ownerId", "batchId", "position");
CREATE UNIQUE INDEX "media_uploads_batch_primary_key" ON "media_uploads"("ownerId", "batchId") WHERE "isPrimary" = true;
CREATE INDEX "media_uploads_ownerId_completedAt_updatedAt_idx" ON "media_uploads"("ownerId", "completedAt", "updatedAt");

CREATE TABLE "media_upload_chunks" (
    "uploadId" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "bytes" BYTEA NOT NULL,
    CONSTRAINT "media_upload_chunks_pkey" PRIMARY KEY ("uploadId", "index"),
    CONSTRAINT "media_upload_chunks_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "media_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
