# Testing Policy — AL-JAMA

> Tài liệu này định nghĩa **quy tắc bắt buộc** khi nào agent phải chạy unit tests và E2E tests trong quá trình phát triển AL-JAMA.
> **Agent PHẢI tuân thủ policy này sau mỗi mốc hoàn thành.**

---

## Quy tắc cốt lõi

### 1. Sau khi hoàn thành 1 EPIC → Chạy Unit Tests của Epic đó

Mỗi khi hoàn thành (merge, hoặc kết thúc implementation của) một Epic, agent **PHẢI chạy unit tests riêng biệt** cho các modules liên quan đến Epic đó, **không chạy toàn bộ test suite**.

#### Lệnh: Chạy unit tests theo module/filter

```powershell
# Ví dụ: Sau hoàn thành Epic E2 (Item Management)
pnpm --filter api test -- --testPathPattern="src/modules/item/"

# Sau hoàn thành Epic E0 (Auth + Project)
pnpm --filter api test -- --testPathPattern="src/modules/auth/|src/modules/project/"

# Sau hoàn thành Epic E3 (Traceability)
pnpm --filter api test -- --testPathPattern="src/modules/traceability/"

# Sau hoàn thành Epic E1 (Admin Config)
pnpm --filter api test -- --testPathPattern="src/modules/project/|src/modules/item/"
```

#### Mapping: Epic → Modules cần test

| Epic | Branch Pattern | Test Path Pattern |
| :--- | :--- | :--- |
| E0 (Platform Foundation) | `feature/E0-*` | `src/modules/auth/\|src/modules/user/\|src/modules/project/` |
| E1 (Admin Config) | `feature/E1-*` | `src/modules/project/` |
| E2 (Item Management) | `feature/E2-*` | `src/modules/item/` |
| E3 (Traceability) | `feature/E3-*` | `src/modules/traceability/` |
| E4 (Collaboration) | `feature/E4-*` | `src/modules/collaboration/` |
| E5-E8 (Review Center) | `feature/E5-*` đến `feature/E8-*` | `src/modules/review/` |
| E9-E10 (Test Management) | `feature/E9-*` đến `feature/E10-*` | `src/modules/test-management/` |

#### Tiêu chí nghiệm thu khi kết thúc Epic

- ✅ Tất cả **unit tests của Epic đó PASS** (0 failures)
- ✅ Build không có lỗi TypeScript (`pnpm build:api`)
- ✅ Lint không có errors (`pnpm --filter api lint`)

---

### 2. Sau khi hoàn thành 1 PHASE hoặc khi được chỉ định → Chạy toàn bộ Tests

Chỉ được chạy **toàn bộ unit tests + E2E tests** khi:

1. **Hoàn thành 1 PHASE** (milestone verification branch, vd: `chore/phase-1-verification`)
2. **Người dùng chỉ định rõ** (`"chạy hết tests"`, `"test tất cả"`, `"nghiệm thu phase"`, v.v.)

#### Lệnh: Chạy full test suite

```powershell
# Full unit tests (toàn bộ 5 suites)
pnpm test:api

# Full E2E tests (cần Docker PostgreSQL đang chạy)
pnpm test:e2e

# Hoặc chạy đồng thời (tuần tự)
pnpm test:api && pnpm test:e2e
```

> [!NOTE]
> E2E tests (`pnpm test:e2e`) tự động bật Docker container nếu chưa chạy (`docker-compose -f docker/docker-compose.dev.yml up -d`), tạo database `aljama_test`, và deploy migrations.

#### Tiêu chí nghiệm thu khi kết thúc Phase

- ✅ **39 unit tests** (hoặc tương đương theo tổng tests hiện tại) PASS
- ✅ **13 E2E tests** (hoặc tương đương theo tổng tests hiện tại) PASS
- ✅ Build production không lỗi: `pnpm build:api`

---

### 3. Tóm tắt quyết định khi nào chạy test gì

```
Hoàn thành implementation → Hoàn thành 1 Epic?
  ├── YES → Chạy unit tests CHỈ cho modules của Epic đó
  │           pnpm --filter api test -- --testPathPattern="<module-path>"
  └── NO (Hoàn thành Phase) → Chạy TOÀN BỘ unit tests + E2E
              pnpm test:api && pnpm test:e2e

Người dùng chỉ định "chạy hết tests" / "nghiệm thu phase"?
  └── YES → Chạy TOÀN BỘ unit tests + E2E
              pnpm test:api && pnpm test:e2e
```

---

### 4. Quy tắc cho CI/CD (`ci.yml`)

Pipeline CI trên branch `main` và pull requests chạy **`pnpm test`** (toàn bộ tests) vì đây là ngưỡng bảo vệ code trên main branch.

> [!IMPORTANT]
> **Feature branches** chỉ cần chạy unit tests của module tương ứng.
> **Main branch CI** (`ci.yml`) luôn chạy toàn bộ tests để bảo vệ tính ổn định.

---

### 5. Exception: Không cần chạy test

Agent **không cần chạy tests** trong các trường hợp sau:

- Thay đổi documentation (`*.md`, `*.txt`)
- Thay đổi cấu hình CI/Docker không ảnh hưởng code
- Chỉ thêm/sửa comment trong code
- Refactoring thuần túy không thay đổi logic (sau đó vẫn nên chạy unit test liên quan để confirm)
