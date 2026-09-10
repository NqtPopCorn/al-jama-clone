# Migration & Seed Policy — AL-JAMA

> **Quy tắc bắt buộc** về Prisma migrate và seed — áp dụng mọi môi trường.
> Agent PHẢI tuân thủ khi thực hiện bất kỳ thao tác liên quan database.

---

## 1. Nguyên tắc bất biến

| Quy tắc | Mô tả |
| :--- | :--- |
| **KHÔNG dùng `migrate dev` trên production** | `prisma migrate dev` có thể reset DB. Chỉ dùng trên local dev |
| **KHÔNG dùng `deleteMany()` trong production seed** | Xóa dữ liệu thực tế không thể khôi phục |
| **KHÔNG chạy `dev-seed.ts` trên production** | Script có guard kiểm tra `NODE_ENV` và `DATABASE_URL` |
| **Seed production phải idempotent** | Dùng `upsert` hoặc check `findFirst` trước khi `create` |
| **Migration phải luôn chạy trước khi app start** | Đảm bảo schema và app code đồng bộ |

---

## 2. Phân biệt môi trường

### Development / Local

```powershell
# Tạo migration mới sau khi sửa schema.prisma
pnpm --filter api prisma:migrate:dev

# Nạp demo data để test (XÓA VÀ TẠO LẠI TOÀN BỘ)
pnpm --filter api prisma:seed:dev

# Nạp reference data (idempotent, an toàn)
pnpm --filter api prisma:seed:master
```

### Production / Staging / CI

```powershell
# ✅ ĐÚNG: Chỉ apply migration đã commit, KHÔNG tạo mới, KHÔNG reset
pnpm --filter api prisma:migrate:deploy

# ✅ ĐÚNG: Nạp reference data (idempotent — an toàn chạy nhiều lần)
pnpm --filter api prisma:seed:master

# ❌ SAI: KHÔNG BAO GIỜ chạy trên production
pnpm --filter api prisma:migrate:dev     # Có thể reset DB!
pnpm --filter api prisma:seed:dev        # XÓA HẾT DỮ LIỆU!
```

---

## 3. Hai loại Seed — Phân biệt rõ ràng

### `prisma/dev-seed.ts` — Chỉ dành cho Development

| Thuộc tính | Giá trị |
| :--- | :--- |
| Môi trường | Development, local, staging demo |
| Hành động | Xóa toàn bộ DB → tạo lại từ đầu |
| Mục đích | Demo data, test data, onboarding dev mới |
| Production guard | ✅ Có — tự động block nếu `NODE_ENV=production` |
| Lệnh | `pnpm --filter api prisma:seed:dev` |

### `prisma/master-seed.ts` — Safe for Production

| Thuộc tính | Giá trị |
| :--- | :--- |
| Môi trường | Tất cả — dev, staging, **production** |
| Hành động | Upsert reference data — KHÔNG xóa gì cả |
| Mục đích | Global relationship types, system config |
| Idempotent | ✅ Có — an toàn chạy nhiều lần |
| Lệnh | `pnpm --filter api prisma:seed:master` |

---

## 4. Quy trình Migration bền vững

### Khi tạo migration mới (Dev workflow)

```mermaid
graph LR
    A[Sửa schema.prisma] --> B[pnpm prisma:migrate:dev]
    B --> C[Git commit migration file]
    C --> D[PR → Code review]
    D --> E[Merge to main]
    E --> F[CI: migrate deploy tự động]
```

### Thứ tự bắt buộc khi deploy

```
1. prisma migrate deploy   ← Áp dụng migration trước
2. prisma:seed:master      ← Nạp reference data (nếu có thay đổi)
3. node dist/main          ← Khởi động app
```

> [!IMPORTANT]
> **Migration PHẢI chạy TRƯỚC khi app start.** Nếu migration fail, app KHÔNG được khởi động.
> Trong Docker: dùng `entrypoint.sh` hoặc Kubernetes initContainer để đảm bảo thứ tự này.

---

## 5. Checklist khi có thay đổi schema

Khi agent implement tính năng mới cần thay đổi database schema:

- [ ] Sửa `prisma/schema.prisma`
- [ ] Chạy `pnpm --filter api prisma:migrate:dev` để tạo migration file
- [ ] Commit migration file cùng với code thay đổi trong **cùng 1 PR**
- [ ] KHÔNG bao giờ edit file migration đã commit (tạo migration mới để fix)
- [ ] Nếu cần reference data mới → thêm vào `master-seed.ts` (idempotent)
- [ ] KHÔNG thêm demo data vào `master-seed.ts`

---

## 6. Cấu trúc file

```
apps/api/prisma/
├── schema.prisma           # Schema definition — single source of truth
├── prisma.config.ts        # Prisma v7 configuration
├── migrations/             # Migration files — always commit, never edit
│   ├── 20260909090552_init_database_schema/
│   └── migration_lock.toml
├── master-seed.ts          # ✅ Production-safe reference data (idempotent)
├── dev-seed.ts             # ⚠️ Dev-only demo data (has production guard)
└── seed.ts                 # Legacy — chỉ giữ để tham khảo, không dùng
```

---

## 7. CI/CD Pipeline (`ci.yml`)

Pipeline hiện tại đã được cấu hình đúng:

```yaml
- name: Deploy Migrations (safe, no reset)
  run: pnpm --filter api prisma:migrate:deploy

- name: Seed reference data (idempotent)
  run: pnpm --filter api prisma:seed:master

- name: Test (unit tests only)
  run: pnpm test:api
```

> [!NOTE]
> E2E tests không chạy trên CI vì cần Docker container Redis. Chạy E2E locally với `pnpm test:e2e`.

---

## 8. Khi cần rollback migration

Prisma không hỗ trợ auto-rollback. Quy trình thủ công:

1. Tạo migration mới để revert thay đổi (forward-only migration)
2. Hoặc restore từ database backup
3. **KHÔNG bao giờ** xóa file migration đã được deploy
