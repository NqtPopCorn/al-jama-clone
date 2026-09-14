-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'baseline_trigger_type') THEN
    CREATE TYPE "baseline_trigger_type" AS ENUM ('review_initiate', 'revision_publish');
  END IF;
END$$;

-- DropIndex
DROP INDEX IF EXISTS "review_baselines_review_id_revision_number_item_version_id_key";

-- AlterTable
ALTER TABLE "review_baselines" ADD COLUMN IF NOT EXISTS "trigger_type" "baseline_trigger_type" NOT NULL DEFAULT 'review_initiate';

-- AlterTable
ALTER TABLE "review_comments" ADD COLUMN IF NOT EXISTS "resolved_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "resolved_by" UUID,
ADD COLUMN IF NOT EXISTS "resolved_note" TEXT;

-- AlterTable
ALTER TABLE "review_items" DROP COLUMN IF EXISTS "is_context_only",
ADD COLUMN IF NOT EXISTS "include_downstream" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "include_upstream" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "item_version_at_send_id" UUID;

-- AlterTable
ALTER TABLE "review_participants" ADD COLUMN IF NOT EXISTS "invited_by" UUID;

-- AlterTable
ALTER TABLE "review_revisions" ADD COLUMN IF NOT EXISTS "notification_sent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "review_signatures" ADD COLUMN IF NOT EXISTS "reauth_confirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "finalized_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "review_baselines_review_id_revision_number_item_version_id__key" ON "review_baselines"("review_id", "revision_number", "item_version_id", "trigger_type");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_items_item_version_at_send_id_fkey') THEN
    ALTER TABLE "review_items" ADD CONSTRAINT "review_items_item_version_at_send_id_fkey" FOREIGN KEY ("item_version_at_send_id") REFERENCES "item_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_participants_invited_by_fkey') THEN
    ALTER TABLE "review_participants" ADD CONSTRAINT "review_participants_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- Fix legacy participant_id in review_item_status if pointing to user_id
UPDATE "review_item_status" ris
SET "participant_id" = rp."id"
FROM "review_items" ri
JOIN "review_participants" rp ON rp."review_id" = ri."review_id"
WHERE ris."review_item_id" = ri."id" AND rp."user_id" = ris."user_id";

DELETE FROM "review_item_status" WHERE "participant_id" NOT IN (SELECT "id" FROM "review_participants");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_item_status_participant_id_fkey') THEN
    ALTER TABLE "review_item_status" ADD CONSTRAINT "review_item_status_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "review_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_comments_resolved_by_fkey') THEN
    ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'review_revisions_published_by_fkey') THEN
    ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END$$;
