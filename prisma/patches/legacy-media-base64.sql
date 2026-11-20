-- Compatibility patch for databases using the previous external media storage.
-- Existing files retain their bucket/storageKey metadata. An empty base64Data
-- means that the file contents have not been imported into the database.
-- Apply this patch directly; it does not replace Prisma migration history.
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE "media_assets"
    ADD COLUMN IF NOT EXISTS "base64Data" TEXT NOT NULL DEFAULT '';

-- The current backend supplies base64Data instead of external storage keys.
-- Keep the legacy columns and their contents, but allow new uploads without them.
DO $$
DECLARE
    legacy_column TEXT;
BEGIN
    FOREACH legacy_column IN ARRAY ARRAY['bucket', 'storageKey'] LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'media_assets'
              AND column_name = legacy_column
        ) THEN
            EXECUTE format(
                'ALTER TABLE "media_assets" ALTER COLUMN %I DROP NOT NULL',
                legacy_column
            );
        END IF;
    END LOOP;
END $$;

COMMIT;
