ALTER TABLE "users" ADD COLUMN "photoMediaId" TEXT;
ALTER TABLE "institutions" ADD COLUMN "photoMediaId" TEXT;

CREATE UNIQUE INDEX "users_photoMediaId_key" ON "users"("photoMediaId");
CREATE UNIQUE INDEX "institutions_photoMediaId_key" ON "institutions"("photoMediaId");

ALTER TABLE "users" ADD CONSTRAINT "users_photoMediaId_fkey"
    FOREIGN KEY ("photoMediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_photoMediaId_fkey"
    FOREIGN KEY ("photoMediaId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
