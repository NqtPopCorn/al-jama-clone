# AL-JAMA — JAMA-Clone MVP

> **Hệ thống quản lý yêu cầu, truy vết, review & cộng tác** — mô phỏng Jama Connect.

## Project Overview

Đây là dự án thực tập (internship), xây dựng MVP cho hệ thống quản lý yêu cầu doanh nghiệp (Requirements Management System) dựa trên phân tích Jama Connect. Hệ thống bao gồm:

- **Item Management** — Quản lý yêu cầu, use case, test case
- **Traceability** — Truy vết quan hệ upstream/downstream, suspect flag
- **Review Center** — Review/phê duyệt nội dung, baseline, chữ ký điện tử
- **Collaboration** — Stream, comment, @mention, real-time
- **Test Management** (Post-MVP) — Test plan, cycle, run, defect

## Tech Stack

| Layer                | Technology                               | Version | Rationale                                                  |
| -------------------- | ---------------------------------------- | ------- | ---------------------------------------------------------- |
| **Monorepo**         | pnpm workspace                           | latest  | Shared types, faster installs                              |
| **Backend**          | NestJS + TypeScript                      | v10+    | Module system = Modular Monolith native                    |
| **ORM**              | Prisma                                   | v7+     | Type-safe, migration-first, introspection                  |
| **Database**         | PostgreSQL                               | 15+     | JSONB, GIN index, UUID native                              |
| **Queue / Jobs**     | BullMQ + Redis                           | latest  | Email notification, async tasks                            |
| **Real-time**        | Socket.io (via @nestjs/websockets)       | latest  | Connected Users, live review updates                       |
| **Auth**             | Passport.js + JWT                        | latest  | Simple, well-documented                                    |
| **Frontend**         | React 18 + Vite + TypeScript             | latest  | Fast HMR, modern DX                                        |
| **UI Library**       | shadcn/ui + Radix UI + Tailwind CSS      | latest  | Modern, customizable, accessible                           |
| **Rich Text**        | Tiptap (ProseMirror)                     | v2+     | Extensible, headless, collaboration-ready                  |
| **State Mgmt**       | TanStack Query + Zustand                 | latest  | Server state + client state separation                     |
| **Routing**          | React Router v6                          | latest  | Nested routes, lazy loading                                |
| **Forms**            | React Hook Form + Zod                    | latest  | Performant, type-safe validation                           |
| **Testing**          | Vitest + Testing Library (FE), Jest (BE) | latest  | Fast, modern                                               |
| **Containerization** | Docker + Docker Compose                  | latest  | Dev + prod deployment                                      |
| **File Storage**     | Cloudinary                               | latest  | Managed cloud storage for attachments, free tier available |
| **Email**            | Nodemailer + SMTP                        | latest  | Notification emails                                        |

## Architecture — Modular Monolith

```
al-jama/
├── packages/
│   └── shared/                  # Shared types, constants, utils
│       ├── src/
│       │   ├── types/           # Shared TypeScript interfaces/types
│       │   ├── constants/       # Enums, business rule constants
│       │   └── utils/           # Pure utility functions
│       └── package.json
├── apps/
│   ├── api/                     # NestJS Backend (Modular Monolith)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Authentication & Authorization
│   │   │   │   ├── user/        # User management, license types
│   │   │   │   ├── project/     # Project, folder, item type config
│   │   │   │   ├── item/        # Item CRUD, versioning, locking
│   │   │   │   ├── traceability/# Relationships, suspect flag, impact analysis
│   │   │   │   ├── collaboration/# Stream, comments, mentions, actions
│   │   │   │   ├── review/      # Review Center (largest module)
│   │   │   │   │   ├── dto/
│   │   │   │   │   ├── entities/
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── review-initiation.service.ts
│   │   │   │   │   │   ├── review-execution.service.ts
│   │   │   │   │   │   ├── review-moderation.service.ts
│   │   │   │   │   │   └── review-baseline.service.ts
│   │   │   │   │   └── controllers/
│   │   │   │   ├── notification/# Email, in-app notifications
│   │   │   │   └── audit/       # Audit log cross-cutting
│   │   │   ├── common/          # Guards, interceptors, decorators
│   │   │   ├── prisma/          # Prisma service, seed
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── prisma.config.ts     # Prisma v7 configuration (datasource url, schema, migrations)
│   │   └── package.json
│   └── web/                     # React Frontend
│       ├── src/
│       │   ├── components/      # Shared UI components
│       │   │   ├── ui/          # shadcn/ui components
│       │   │   ├── layout/      # App shell, sidebar, header
│       │   │   ├── editor/      # Tiptap rich text editor
│       │   │   └── common/      # Tree, DataTable, etc.
│       │   ├── features/        # Feature-based modules
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── explorer/    # Tree explorer (BR-NAV-04)
│       │   │   ├── item/        # Item editor, list view, reading view
│       │   │   ├── traceability/# Trace view, impact analysis
│       │   │   ├── collaboration/# Stream panel
│       │   │   ├── review/      # Review Center
│       │   │   └── admin/       # Item type config, relationship type config
│       │   ├── hooks/           # Custom React hooks
│       │   ├── lib/             # API client, utils
│       │   ├── stores/          # Zustand stores
│       │   ├── types/           # Frontend-specific types
│       │   └── App.tsx
│       └── package.json
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## Module Boundary Rules

> **CRITICAL**: Các module trong NestJS backend PHẢI tuân thủ ranh giới nghiêm ngặt.

1. **Module chỉ expose qua public service** — không import trực tiếp repository/entity của module khác.
2. **Cross-module communication** qua NestJS dependency injection — module A inject public service của module B.
3. **Database tables** thuộc về đúng 1 module — không có 2 module cùng viết vào 1 bảng.
4. **Events cho side-effects** — dùng NestJS `EventEmitter2` cho notification/audit log khi action xảy ra ở module khác.

### Module → Table Ownership

| Module          | Tables                                                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth`          | (sử dụng `user` module)                                                                                                                                                           |
| `user`          | users, user_groups, user_group_members, project_members                                                                                                                           |
| `project`       | projects, folders, item_types, item_type_fields, relationship_types                                                                                                               |
| `item`          | items, item_versions, item_subscriptions, item_attachments, item_activity_log                                                                                                     |
| `collaboration` | comments, comment_mentions, comment_hashtags, comment_actions                                                                                                                     |
| `traceability`  | item_relationships                                                                                                                                                                |
| `review`        | review_templates, reviews, review_items, review_participants, review_item_status, review_comments, review_comment_mentions, review_revisions, review_baselines, review_signatures |
| `notification`  | notifications                                                                                                                                                                     |
| `audit`         | audit_logs                                                                                                                                                                        |

## Coding Conventions

### General

- **Language**: TypeScript strict mode — no `any` unless absolutely necessary.
- **Naming**: camelCase for variables/functions, PascalCase for classes/types/interfaces, UPPER_SNAKE_CASE for constants.
- **File naming**: kebab-case (`review-initiation.service.ts`, `item-editor.tsx`).
- **Import order**: Node builtins → external packages → internal packages (@shared) → relative imports.

### Backend (NestJS)

- Each module follows: `module.ts` → `controller.ts` → `service.ts` → `dto/` → `entities/`.
- Use **DTOs** with `class-validator` decorators for request validation.
- Use **Prisma Client** via a shared `PrismaService` — never raw SQL unless for performance-critical queries.
- Business logic in **services** — controllers are thin (validate → delegate → respond).
- Error handling: throw NestJS built-in exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`).
- Use `@nestjs/event-emitter` for cross-module side effects (notifications, audit logs).

### Frontend (React)

- **Feature-based structure** — each feature folder contains its components, hooks, types, and API calls.
- **Components**: Functional components with TypeScript props interfaces.
- **Data fetching**: TanStack Query (`useQuery`, `useMutation`) — no `useEffect` for data fetching.
- **State**: Server state in TanStack Query cache, UI state in Zustand stores.
- **Styling**: Tailwind CSS utility classes, shadcn/ui components as base.
- **No prop drilling** — use context or Zustand for deeply shared state.

### Database & Prisma

- **Prisma Version**: v7.x (v7.10.0+), kiến trúc TypeScript/Rust-free.
- **Driver Adapter**: Bắt buộc dùng `@prisma/adapter-pg` bọc quanh `pg.Pool` cho kết nối PostgreSQL.
- **Configuration**: Cấu hình kết nối DB được định nghĩa tại `apps/api/prisma.config.ts`. KHÔNG khai báo `url` trong khối `datasource db` của `schema.prisma`.
- **PrismaService**: Kế thừa `PrismaClient`, khởi tạo với `{ adapter: new PrismaPg(pool) }`, đóng `pool.end()` và `$disconnect()` trong `onModuleDestroy`.
- **UUID** cho all primary keys (`@default(uuid()) @db.Uuid`).
- **Soft delete** cho items, comments (`isDeleted Boolean @default(false)`).
- **Timestamps**: `createdAt`, `updatedAt` trên mọi bảng.
- **Enums** khai báo trong Prisma schema, map sang PostgreSQL enums qua `@map`.
- **Naming**: snake_case cho DB columns/tables (Prisma `@map`), camelCase trong TypeScript.

## Business Rules Reference

Khi implement, luôn tham chiếu các quy tắc nghiệp vụ từ BRD:

| Rule  | Description                                              | Impact                                   |
| ----- | -------------------------------------------------------- | ---------------------------------------- |
| QT-01 | Khoá item khi đang sửa — chỉ 1 user edit tại 1 thời điểm | `items.locked_by`, `items.locked_at`     |
| QT-02 | Suspect flag chỉ lan 1 cấp downstream                    | `item_relationships.is_suspect`          |
| QT-03 | Relationship required/optional do Admin cấu hình         | `relationship_types.is_required_default` |
| QT-04 | Reviewer ≠ Approver status set                           | `review_item_status.status` enum         |
| QT-05 | Publish revision → reset tất cả status về not_reviewed   | Tạo row mới với revision_number mới      |
| QT-06 | Có reject → chặn finalize/e-signature                    | Check trước khi cho phép complete        |
| QT-07 | Approval template immutable, Peer template editable      | `review_templates.is_editable_on_create` |
| QT-08 | reviewer_limited license → chỉ xem qua Review Center     | Permission guard                         |
| QT-09 | Close for Feedback trước batch edit/transition           | State machine guard                      |

## Git Conventions

- **Strategy**: GitHub Flow — `main` luôn deployable, mọi thay đổi qua feature branch → PR → squash merge.
- **Branch naming**: `feature/E{N}-{short-description}`, `fix/{issue}`, `chore/{task}`, `docs/{topic}`
- **Commit message**: Conventional Commits — `feat(module): description`, `fix(module): description`
- **Merge policy**: Squash merge — mỗi PR = 1 commit gọn trên `main`.
- **PR**: Mở PR cho mọi thay đổi (kể cả solo) để CI chạy lint/build/test. Link Epic/BR code trong description.
- **Chi tiết đầy đủ**: Xem `docs/GIT_FLOW.md`.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aljama?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```
