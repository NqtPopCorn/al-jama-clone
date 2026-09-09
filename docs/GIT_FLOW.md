# Git Flow — AL-JAMA

> **Strategy: GitHub Flow** — đơn giản, hiệu quả cho solo/small team với CI/CD.

---

## 1. Nguyên tắc cốt lõi

- `main` **luôn ở trạng thái deployable** — không commit trực tiếp lên `main`.
- Mọi thay đổi đi qua **feature branch → Pull Request → CI pass → Squash Merge**.
- PR luôn được mở (kể cả solo dev) để GitHub Actions chạy **lint / build / test** tự động.
- Mỗi PR = **1 squash commit** gọn gàng trên `main`.

---

## 2. Branching Model

```
main (protected, production-ready)
 │
 ├── feature/E0-auth-login          ← Feature mới theo Epic
 ├── feature/E2-item-editor
 ├── fix/suspect-flag-cascade       ← Sửa bug
 ├── chore/docker-prod-config       ← Cấu hình, CI, refactor
 └── docs/api-swagger-update        ← Tài liệu
```

> **Không dùng** nhánh `develop`, `release`, hay `hotfix` — không cần thiết cho solo dev + 2 môi trường.

---

## 3. Branch Naming Convention

| Pattern                | Khi nào dùng                   | Ví dụ                       |
| ---------------------- | ------------------------------ | --------------------------- |
| `feature/E{N}-{mô-tả}` | Feature mới theo Epic (BRD)    | `feature/E2-item-editor`    |
| `feature/{mô-tả}`      | Feature nhỏ, không thuộc Epic  | `feature/add-search-filter` |
| `fix/{mô-tả}`          | Sửa bug                        | `fix/suspect-flag-cascade`  |
| `chore/{mô-tả}`        | CI/CD, cấu hình, refactor, dep | `chore/prisma-seed-data`    |
| `docs/{mô-tả}`         | Cập nhật tài liệu              | `docs/api-swagger-review`   |

**Quy tắc:**

- Tất cả **kebab-case**, viết thường.
- Tên ngắn gọn, mô tả được mục đích (2–5 từ).
- Prefix Epic code `E{N}` cho feature chính để dễ truy vết ngược BRD.

---

## 4. Commit Message Convention (Conventional Commits)

### Format

```
<type>(<scope>): <mô tả ngắn gọn>

[body — tuỳ chọn, giải thích WHY, không chỉ WHAT]

[footer — tuỳ chọn, link issue/BR]
```

### Types

| Type       | Ý nghĩa                       | Ví dụ                                                |
| ---------- | ----------------------------- | ---------------------------------------------------- |
| `feat`     | Thêm feature mới              | `feat(item): add item versioning with compare view`  |
| `fix`      | Sửa bug                       | `fix(traceability): suspect flag not cascading`      |
| `refactor` | Refactor (không đổi behavior) | `refactor(review): extract state machine service`    |
| `chore`    | Cấu hình, build, deps         | `chore(prisma): add seed data for 3 item types`      |
| `docs`     | Tài liệu                      | `docs(api): update swagger for review endpoints`     |
| `test`     | Thêm/sửa test                 | `test(item): add unit tests for lock service`        |
| `style`    | Format code (không đổi logic) | `style: run prettier on all files`                   |
| `ci`       | Thay đổi CI/CD pipeline       | `ci: add GitHub Actions workflow for lint and build` |
| `perf`     | Cải thiện hiệu năng           | `perf(item): add GIN index for JSONB custom fields`  |

### Scopes (= NestJS module hoặc frontend feature)

**Backend:** `auth`, `user`, `project`, `item`, `traceability`, `collaboration`, `review`, `notification`, `audit`, `prisma`

**Frontend:** `web`, `explorer`, `dashboard`, `editor`, `review-center`

**Infra:** `ci`, `docker`, `deps`

**Shared:** `shared`

### Ví dụ commit tốt vs xấu

```bash
# ✅ Tốt — rõ ràng, có scope, mô tả hành động
feat(item): implement lock/unlock with 30-min auto-expire
fix(review): prevent finalize when rejected items exist (QT-06)
chore(docker): add health check for PostgreSQL container

# ❌ Xấu — mơ hồ, không có scope, không rõ hành động
update code
fix bug
changes
```

---

## 5. Pull Request Workflow

### 5.1 Tạo branch và làm việc

```bash
# 1. Luôn bắt đầu từ main mới nhất
git checkout main
git pull origin main

# 2. Tạo feature branch
git checkout -b feature/E2-item-editor

# 3. Code + commit thường xuyên (nhỏ, có ý nghĩa)
git commit -m "feat(item): scaffold item module with CRUD DTOs"
git commit -m "feat(item): implement item versioning service"
git commit -m "test(item): add unit tests for versioning"

# 4. Push lên remote
git push -u origin feature/E2-item-editor
```

### 5.2 Mở Pull Request

- **Title**: Theo Conventional Commits format — `feat(item): implement item CRUD and versioning`
- **Description** gồm:
  - **Tóm tắt** thay đổi chính
  - **Epic/BR reference** — `Closes E2`, `Implements BR-ITEM-01, BR-ITEM-02`
  - **Checklist** (tuỳ chọn):
    ```markdown
    ## Changes

    - Scaffold item module (controller, service, DTOs)
    - Implement item versioning with compare view
    - Add Prisma migration for items and item_versions tables

    ## Related

    - Epic: E2 — Quản lý Item
    - BR: BR-ITEM-01, BR-ITEM-02, BR-ITEM-04

    ## Checklist

    - [x] Lint passes (`pnpm lint`)
    - [x] Build passes (`pnpm build`)
    - [x] Tests pass (`pnpm test`)
    ```

### 5.3 CI tự động chạy

GitHub Actions sẽ tự động chạy trên mọi PR:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm build`
4. `pnpm test` (khi có)

### 5.4 Merge

- **Merge strategy: Squash and Merge** — gom toàn bộ commits trong PR thành 1 commit gọn trên `main`.
- Squash commit message = PR title (theo Conventional Commits).
- Sau khi merge, **xoá branch** trên remote (GitHub tự làm nếu bật setting).

---

## 6. Quy trình theo Phase

```
Phase 1 (E0-E3):
  main ← feature/E0-auth-login
  main ← feature/E0-dashboard
  main ← feature/E1-admin-item-type
  main ← feature/E2-item-editor
  main ← feature/E2-item-versioning
  main ← feature/E3-traceability
  main ← chore/prisma-schema-phase1

Phase 2 (E4-E6):
  main ← feature/E4-collaboration-stream
  main ← feature/E5-review-initiation
  main ← feature/E6-review-execution

Phase 3 (E7-E8):
  main ← feature/E7-review-moderation
  main ← feature/E8-baseline-reports
```

> Mỗi feature branch nên **nhỏ gọn** (1-3 ngày work). Nếu Epic lớn (ví dụ E2, E6), **tách thành nhiều PR** thay vì 1 PR khổng lồ.

---

## 7. Xử lý tình huống

### Branch bị lỗi thời (main đã có commit mới)

```bash
# Rebase lên main mới nhất (ưu tiên hơn merge)
git checkout feature/E2-item-editor
git fetch origin
git rebase origin/main

# Nếu có conflict, resolve rồi:
git rebase --continue
git push --force-with-lease
```

### Cần hotfix gấp trên production

```bash
# Vẫn tạo branch từ main, không commit thẳng
git checkout main
git pull origin main
git checkout -b fix/critical-auth-bypass

# Fix + commit + PR + squash merge bình thường
# (chỉ là PR nhỏ hơn, merge nhanh hơn)
```

### Muốn thử nghiệm mà chưa chắc merge

```bash
# Tạo branch bình thường, đặt prefix rõ
git checkout -b chore/experiment-tiptap-collab

# Nếu ok → mở PR
# Nếu không ok → xoá branch, không ảnh hưởng main
```

---

## 8. GitHub Repository Settings (khuyến nghị)

Cấu hình trên GitHub repo → Settings:

- **Branch protection rule cho `main`:**
  - ✅ Require pull request before merging
  - ✅ Require status checks to pass (CI workflow)
  - ✅ Require branches to be up to date
  - ✅ Automatically delete head branches after merge

- **Merge button settings:**
  - ✅ Allow squash merging (mặc định)
  - ❌ Allow merge commits (tắt)
  - ❌ Allow rebase merging (tắt)
  - ✅ Default to squash merge commit message = PR title

---

## 9. Tóm tắt Quick Reference

```bash
# === Bắt đầu feature mới ===
git checkout main && git pull
git checkout -b feature/E2-item-editor

# === Trong lúc code ===
git add . && git commit -m "feat(item): implement CRUD service"

# === Sẵn sàng merge ===
git push -u origin feature/E2-item-editor
# → Mở PR trên GitHub
# → CI chạy tự động
# → Squash and Merge
# → Branch tự xoá

# === Lệnh hữu ích ===
git log --oneline -10          # Xem 10 commit gần nhất
git branch -a                  # Xem tất cả branch
git branch -d feature/done     # Xoá branch local đã merge
```
