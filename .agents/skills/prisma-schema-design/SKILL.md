---
name: prisma-schema-design
description: |
  Skill để thiết kế và mở rộng Prisma schema cho dự án AL-JAMA.
  Bao gồm conventions, patterns cho UUID, soft-delete, versioning, JSONB,
  enum mapping, và quan hệ giữa các bảng theo Database Schema đã thiết kế.
---

# Prisma Schema Design — AL-JAMA

## Khi nào sử dụng

- Thêm model/bảng mới vào Prisma schema
- Thêm field/relation vào model có sẵn
- Tạo migration mới
- Cần tham khảo conventions khi viết schema

## Conventions

### 0. Datasource & Configuration (Prisma v7)

Prisma v7 tách biệt cấu hình kết nối DB sang `apps/api/prisma.config.ts`:

```prisma
// apps/api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  // LƯU Ý: KHÔNG đặt url ở đây (đã chuyển sang prisma.config.ts)
}
```

```typescript
// apps/api/prisma.config.ts
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
```

### 1. UUID Primary Key

```prisma
model Item {
  id String @id @default(uuid()) @db.Uuid
}
```

### 2. Timestamps

```prisma
model Item {
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
}
```

### 3. Soft Delete

```prisma
model Item {
  isDeleted Boolean @default(false) @map("is_deleted")
}
```

> Áp dụng cho: items, comments. KHÔNG dùng cho: reviews, relationships.

### 4. Enum Definition

```prisma
enum LicenseType {
  FULL        @map("full")
  REVIEWER_LIMITED @map("reviewer_limited")
}

enum ReviewStatus {
  DRAFT               @map("draft")
  ACTIVE              @map("active")
  CLOSED_FOR_FEEDBACK @map("closed_for_feedback")
  ARCHIVED            @map("archived")
  FINALIZED           @map("finalized")
}
```

### 5. Field/Table Naming (snake_case mapping)

```prisma
model ItemVersion {
  id            String @id @default(uuid()) @db.Uuid
  itemId        String @map("item_id") @db.Uuid
  versionNumber Int    @map("version_number")

  @@map("item_versions")
}
```

### 6. JSONB Fields

```prisma
model Item {
  customFields Json? @map("custom_fields") @db.JsonB
}

model ItemVersion {
  snapshot Json @db.JsonB  // Full snapshot cho version comparison
}
```

### 7. Self-referential Relations

```prisma
model Folder {
  id             String  @id @default(uuid()) @db.Uuid
  parentFolderId String? @map("parent_folder_id") @db.Uuid

  parent   Folder?  @relation("FolderTree", fields: [parentFolderId], references: [id])
  children Folder[] @relation("FolderTree")

  @@map("folders")
}

model Comment {
  id              String  @id @default(uuid()) @db.Uuid
  parentCommentId String? @map("parent_comment_id") @db.Uuid

  parent  Comment?  @relation("CommentThread", fields: [parentCommentId], references: [id])
  replies Comment[] @relation("CommentThread")

  @@map("comments")
}
```

### 8. Polymorphic Relations (Stream comments)

```prisma
enum CommentScope {
  ITEM         @map("item")
  PROJECT      @map("project")
  ORGANIZATION @map("organization")
}

model Comment {
  scopeType CommentScope @map("scope_type")
  scopeId   String?      @map("scope_id") @db.Uuid
  // Application logic resolves scopeId → items.id or projects.id
}
```

### 9. Composite Unique Constraints

```prisma
model ReviewItemStatus {
  reviewItemId   String @map("review_item_id") @db.Uuid
  participantId  String @map("participant_id") @db.Uuid
  userId         String @map("user_id") @db.Uuid
  revisionNumber Int    @map("revision_number")

  @@unique([reviewItemId, userId, revisionNumber])
  @@map("review_item_status")
}

model ReviewBaseline {
  reviewId       String              @map("review_id") @db.Uuid
  revisionNumber Int                 @map("revision_number")
  itemVersionId  String              @map("item_version_id") @db.Uuid
  triggerType    BaselineTriggerType @map("trigger_type")

  @@unique([reviewId, revisionNumber, itemVersionId, triggerType])
  @@map("review_baselines")
}
```

### 10. Index cho Performance

```prisma
model Item {
  @@index([projectId, folderId])
  @@index([itemTypeId])
  @@index([assigneeId])
}

model ItemRelationship {
  @@index([upstreamItemId])
  @@index([downstreamItemId])
}

model Comment {
  @@index([scopeType, scopeId])
}

model ReviewItemStatus {
  @@index([reviewId, revisionNumber])
}
```

## Module → Model Mapping (tham khảo Database Schema doc)

| Module        | Models                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User          | User, UserGroup, UserGroupMember, ProjectMember                                                                                                               |
| Project       | Project, Folder, ItemType, ItemTypeField, RelationshipType                                                                                                    |
| Item          | Item, ItemVersion, ItemSubscription, ItemAttachment, ItemActivityLog                                                                                          |
| Collaboration | Comment, CommentMention, CommentHashtag, CommentAction                                                                                                        |
| Traceability  | ItemRelationship                                                                                                                                              |
| Review        | ReviewTemplate, Review, ReviewItem, ReviewParticipant, ReviewItemStatus, ReviewComment, ReviewCommentMention, ReviewRevision, ReviewBaseline, ReviewSignature |
| Notification  | Notification                                                                                                                                                  |
| Audit         | AuditLog                                                                                                                                                      |

## Migration Workflow

```bash
# 1. Sửa schema.prisma
# 2. Tạo migration
pnpm --filter api prisma migrate dev --name {kebab-case-description}

# 3. Generate Prisma Client
pnpm --filter api prisma generate

# 4. Seed data (nếu cần)
pnpm --filter api prisma db seed
```

## Rules

1. **Mọi model PHẢI có `@@map("snake_case_table_name")`**
2. **Mọi field PHẢI có `@map("snake_case_column_name")` nếu tên khác camelCase**
3. **UUID dùng `@db.Uuid`** — không dùng String thường cho FK
4. **KHÔNG dùng `autoincrement()`** — luôn dùng UUID
5. **Enum values dùng UPPER_CASE** trong Prisma, `@map` sang lowercase cho DB
6. **Relation fields** phải có `onDelete` explicit (Cascade, SetNull, hoặc Restrict)
7. **JSONB fields** dùng `Json` type + `@db.JsonB`
8. **KHÔNG khai báo `url` trong datasource của `schema.prisma`** — cấu hình URL kết nối tại `prisma.config.ts` (chuẩn Prisma v7)
9. **Khởi tạo PrismaClient bắt buộc thông qua `@prisma/adapter-pg`** và `pg.Pool`
