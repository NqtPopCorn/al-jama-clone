-- CreateEnum
CREATE TYPE "license_type" AS ENUM ('full', 'reviewer_limited');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "project_role" AS ENUM ('administrator', 'member');

-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "field_type" AS ENUM ('text', 'richtext', 'number', 'date', 'dropdown', 'user', 'multi_select');

-- CreateEnum
CREATE TYPE "item_activity_type" AS ENUM ('created', 'edited', 'commented', 'subscribed', 'mentioned', 'viewed');

-- CreateEnum
CREATE TYPE "scope_type" AS ENUM ('item', 'project', 'organization');

-- CreateEnum
CREATE TYPE "mentioned_type" AS ENUM ('user', 'group', 'item');

-- CreateEnum
CREATE TYPE "review_template_type" AS ENUM ('approval', 'peer');

-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('draft', 'active', 'closed_for_feedback', 'archived', 'finalized');

-- CreateEnum
CREATE TYPE "review_source_type" AS ENUM ('manual', 'filter');

-- CreateEnum
CREATE TYPE "review_role" AS ENUM ('moderator', 'approver', 'reviewer');

-- CreateEnum
CREATE TYPE "review_item_status_value" AS ENUM ('not_reviewed', 'reviewed', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "review_comment_label" AS ENUM ('general', 'issue', 'question', 'proposed_change');

-- CreateEnum
CREATE TYPE "test_result" AS ENUM ('not_run', 'pass', 'fail', 'pass_with_errors', 'blocked');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(500),
    "license_type" "license_type" NOT NULL DEFAULT 'full',
    "status" "user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_members" (
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "project_role" "project_role" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'active',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folders" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "parent_folder_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_types" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "key" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(100),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_type_fields" (
    "id" UUID NOT NULL,
    "item_type_id" UUID NOT NULL,
    "field_key" VARCHAR(100) NOT NULL,
    "field_label" VARCHAR(255) NOT NULL,
    "field_type" "field_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_type_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_types" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "inverse_name" VARCHAR(255) NOT NULL,
    "is_required_default" BOOLEAN NOT NULL DEFAULT false,
    "suspect_on_upstream_change" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationship_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "folder_id" UUID,
    "item_type_id" UUID NOT NULL,
    "item_key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "assignee_id" UUID,
    "priority" VARCHAR(50),
    "status" VARCHAR(100),
    "custom_fields" JSONB,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "locked_by" UUID,
    "locked_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_versions" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_comment" TEXT,
    "changed_by" UUID NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_subscriptions" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_attachments" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_activity_log" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "activity_type" "item_activity_type" NOT NULL,
    "details" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_relationships" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "upstream_item_id" UUID NOT NULL,
    "downstream_item_id" UUID NOT NULL,
    "relationship_type_id" UUID NOT NULL,
    "is_suspect" BOOLEAN NOT NULL DEFAULT false,
    "suspect_flagged_at" TIMESTAMP(3),
    "suspect_reason" TEXT,
    "cleared_by" UUID,
    "cleared_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "scope_type" "scope_type" NOT NULL,
    "scope_id" UUID,
    "parent_comment_id" UUID,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_mentions" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "mentioned_type" "mentioned_type" NOT NULL,
    "mentioned_id" UUID NOT NULL,

    CONSTRAINT "comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_hashtags" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "tag" VARCHAR(100) NOT NULL,

    CONSTRAINT "comment_hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_actions" (
    "id" UUID NOT NULL,
    "comment_id" UUID NOT NULL,
    "action_text" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "comment_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_templates" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "review_template_type" NOT NULL,
    "requires_signature" BOOLEAN NOT NULL DEFAULT false,
    "enable_time_tracking" BOOLEAN NOT NULL DEFAULT false,
    "allow_approver_add_participant" BOOLEAN NOT NULL DEFAULT false,
    "allow_delegate" BOOLEAN NOT NULL DEFAULT false,
    "is_editable_on_create" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "review_status" NOT NULL DEFAULT 'draft',
    "source_type" "review_source_type" NOT NULL DEFAULT 'manual',
    "source_filter_id" UUID,
    "deadline" TIMESTAMP(3),
    "current_revision_number" INTEGER NOT NULL DEFAULT 1,
    "include_context" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_context_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_participants" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "review_role" "review_role" NOT NULL,
    "is_signer" BOOLEAN NOT NULL DEFAULT false,
    "is_finished" BOOLEAN NOT NULL DEFAULT false,
    "finished_at" TIMESTAMP(3),
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_item_status" (
    "id" UUID NOT NULL,
    "review_item_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "status" "review_item_status_value" NOT NULL DEFAULT 'not_reviewed',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_item_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comments" (
    "id" UUID NOT NULL,
    "review_item_id" UUID NOT NULL,
    "parent_comment_id" UUID,
    "author_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "label" "review_comment_label" NOT NULL DEFAULT 'general',
    "content" TEXT NOT NULL,
    "selected_text" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_comment_mentions" (
    "id" UUID NOT NULL,
    "review_comment_id" UUID NOT NULL,
    "mentioned_user_id" UUID NOT NULL,

    CONSTRAINT "review_comment_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_revisions" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "change_description" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_by" UUID NOT NULL,

    CONSTRAINT "review_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_baselines" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "item_version_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_signatures" (
    "id" UUID NOT NULL,
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "signer_name" VARCHAR(255) NOT NULL,
    "meaning" VARCHAR(255) NOT NULL,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_steps" (
    "id" UUID NOT NULL,
    "test_case_item_id" UUID NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "expected_result" TEXT NOT NULL,

    CONSTRAINT "test_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plans" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "environment" VARCHAR(100),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_plan_testers" (
    "test_plan_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "test_plan_testers_pkey" PRIMARY KEY ("test_plan_id","user_id")
);

-- CreateTable
CREATE TABLE "test_plan_cases" (
    "id" UUID NOT NULL,
    "test_plan_id" UUID NOT NULL,
    "test_case_item_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "test_plan_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_cycles" (
    "id" UUID NOT NULL,
    "test_plan_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "exclude_passed_from_cycle_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_runs" (
    "id" UUID NOT NULL,
    "test_cycle_id" UUID NOT NULL,
    "test_case_item_id" UUID NOT NULL,
    "executed_by" UUID,
    "executed_at" TIMESTAMP(3),
    "overall_result" "test_result" NOT NULL DEFAULT 'not_run',

    CONSTRAINT "test_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_run_steps" (
    "id" UUID NOT NULL,
    "test_run_id" UUID NOT NULL,
    "test_step_id" UUID NOT NULL,
    "result" "test_result" NOT NULL DEFAULT 'not_run',
    "actual_result" TEXT,
    "notes" TEXT,

    CONSTRAINT "test_run_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defect_test_run_links" (
    "id" UUID NOT NULL,
    "defect_item_id" UUID NOT NULL,
    "test_run_id" UUID NOT NULL,
    "test_case_item_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defect_test_run_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "link_url" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_key_key" ON "projects"("key");

-- CreateIndex
CREATE UNIQUE INDEX "item_types_project_id_key_key" ON "item_types"("project_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "item_type_fields_item_type_id_field_key_key" ON "item_type_fields"("item_type_id", "field_key");

-- CreateIndex
CREATE UNIQUE INDEX "items_item_key_key" ON "items"("item_key");

-- CreateIndex
CREATE INDEX "items_project_id_folder_id_idx" ON "items"("project_id", "folder_id");

-- CreateIndex
CREATE INDEX "items_project_id_item_type_id_idx" ON "items"("project_id", "item_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_versions_item_id_version_number_key" ON "item_versions"("item_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "item_subscriptions_item_id_user_id_key" ON "item_subscriptions"("item_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_relationships_upstream_item_id_downstream_item_id_rela_key" ON "item_relationships"("upstream_item_id", "downstream_item_id", "relationship_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_items_review_id_item_id_key" ON "review_items"("review_id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_participants_review_id_user_id_key" ON "review_participants"("review_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_item_status_review_item_id_user_id_revision_number_key" ON "review_item_status"("review_item_id", "user_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "review_revisions_review_id_revision_number_key" ON "review_revisions"("review_id", "revision_number");

-- CreateIndex
CREATE UNIQUE INDEX "review_baselines_review_id_revision_number_item_version_id_key" ON "review_baselines"("review_id", "revision_number", "item_version_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_type_fields" ADD CONSTRAINT "item_type_fields_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_types" ADD CONSTRAINT "relationship_types_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_item_type_id_fkey" FOREIGN KEY ("item_type_id") REFERENCES "item_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_versions" ADD CONSTRAINT "item_versions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_versions" ADD CONSTRAINT "item_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_subscriptions" ADD CONSTRAINT "item_subscriptions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_subscriptions" ADD CONSTRAINT "item_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_attachments" ADD CONSTRAINT "item_attachments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_attachments" ADD CONSTRAINT "item_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_activity_log" ADD CONSTRAINT "item_activity_log_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_activity_log" ADD CONSTRAINT "item_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_upstream_item_id_fkey" FOREIGN KEY ("upstream_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_downstream_item_id_fkey" FOREIGN KEY ("downstream_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_relationship_type_id_fkey" FOREIGN KEY ("relationship_type_id") REFERENCES "relationship_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_relationships" ADD CONSTRAINT "item_relationships_cleared_by_fkey" FOREIGN KEY ("cleared_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_mentions" ADD CONSTRAINT "comment_mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_hashtags" ADD CONSTRAINT "comment_hashtags_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_actions" ADD CONSTRAINT "comment_actions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_actions" ADD CONSTRAINT "comment_actions_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_templates" ADD CONSTRAINT "review_templates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_templates" ADD CONSTRAINT "review_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "review_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_participants" ADD CONSTRAINT "review_participants_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_participants" ADD CONSTRAINT "review_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_item_status" ADD CONSTRAINT "review_item_status_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_item_status" ADD CONSTRAINT "review_item_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_review_item_id_fkey" FOREIGN KEY ("review_item_id") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "review_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_comment_mentions" ADD CONSTRAINT "review_comment_mentions_review_comment_id_fkey" FOREIGN KEY ("review_comment_id") REFERENCES "review_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_revisions" ADD CONSTRAINT "review_revisions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_baselines" ADD CONSTRAINT "review_baselines_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_baselines" ADD CONSTRAINT "review_baselines_item_version_id_fkey" FOREIGN KEY ("item_version_id") REFERENCES "item_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_signatures" ADD CONSTRAINT "review_signatures_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_signatures" ADD CONSTRAINT "review_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_steps" ADD CONSTRAINT "test_steps_test_case_item_id_fkey" FOREIGN KEY ("test_case_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_testers" ADD CONSTRAINT "test_plan_testers_test_plan_id_fkey" FOREIGN KEY ("test_plan_id") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_testers" ADD CONSTRAINT "test_plan_testers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_cases" ADD CONSTRAINT "test_plan_cases_test_plan_id_fkey" FOREIGN KEY ("test_plan_id") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_plan_cases" ADD CONSTRAINT "test_plan_cases_test_case_item_id_fkey" FOREIGN KEY ("test_case_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cycles" ADD CONSTRAINT "test_cycles_test_plan_id_fkey" FOREIGN KEY ("test_plan_id") REFERENCES "test_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cycles" ADD CONSTRAINT "test_cycles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_cycles" ADD CONSTRAINT "test_cycles_exclude_passed_from_cycle_id_fkey" FOREIGN KEY ("exclude_passed_from_cycle_id") REFERENCES "test_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_cycle_id_fkey" FOREIGN KEY ("test_cycle_id") REFERENCES "test_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_test_case_item_id_fkey" FOREIGN KEY ("test_case_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_runs" ADD CONSTRAINT "test_runs_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_steps" ADD CONSTRAINT "test_run_steps_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_run_steps" ADD CONSTRAINT "test_run_steps_test_step_id_fkey" FOREIGN KEY ("test_step_id") REFERENCES "test_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_test_run_links" ADD CONSTRAINT "defect_test_run_links_defect_item_id_fkey" FOREIGN KEY ("defect_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_test_run_links" ADD CONSTRAINT "defect_test_run_links_test_run_id_fkey" FOREIGN KEY ("test_run_id") REFERENCES "test_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defect_test_run_links" ADD CONSTRAINT "defect_test_run_links_test_case_item_id_fkey" FOREIGN KEY ("test_case_item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
