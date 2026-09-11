-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "can_initiate_review" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "review_participants" ADD COLUMN     "group_id" UUID;

-- AddForeignKey
ALTER TABLE "review_participants" ADD CONSTRAINT "review_participants_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
