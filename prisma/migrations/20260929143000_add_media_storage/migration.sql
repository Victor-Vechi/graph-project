-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'PDF', 'DOCUMENT', 'PRESENTATION', 'ARCHIVE', 'DATASET', 'OTHER');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "checksum" TEXT,
    "etag" TEXT,
    "kind" "MediaKind" NOT NULL,
    "visibility" "MediaVisibility" NOT NULL,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "posts"
ADD COLUMN "coverMediaId" TEXT,
ADD COLUMN "coverAlt" TEXT;

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "year" INTEGER,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "mediaId" TEXT NOT NULL,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");
CREATE UNIQUE INDEX "posts_coverMediaId_key" ON "posts"("coverMediaId");
CREATE UNIQUE INDEX "materials_mediaId_key" ON "materials"("mediaId");

ALTER TABLE "media_assets"
ADD CONSTRAINT "media_assets_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "posts"
ADD CONSTRAINT "posts_coverMediaId_fkey"
FOREIGN KEY ("coverMediaId") REFERENCES "media_assets"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "materials"
ADD CONSTRAINT "materials_mediaId_fkey"
FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "materials"
ADD CONSTRAINT "materials_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
