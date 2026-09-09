# HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN AL-JAMA

> **AL-JAMA** — Hệ thống Quản lý Yêu cầu Doanh nghiệp (Requirements Management System), mô phỏng Jama Connect theo kiến trúc Modular Monolith.

---

## 1. Yêu cầu môi trường (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính đã cài đặt các công cụ sau:

| Công cụ                     | Phiên bản khuyến nghị               | Mục đích                      | Kiểm tra cài đặt                      |
| :-------------------------- | :---------------------------------- | :---------------------------- | :------------------------------------ |
| **Node.js**                 | `>= 20.x` (LTS khuyến nghị `v22.x`) | Runtime JavaScript/TypeScript | `node -v`                             |
| **pnpm**                    | `>= 9.x` hoặc `10.x`                | Package manager cho Monorepo  | `pnpm -v`                             |
| **Docker & Docker Compose** | Docker Desktop mới nhất             | Chạy PostgreSQL & Redis local | `docker -v`, `docker compose version` |
| **Git**                     | Mới nhất                            | Quản lý mã nguồn              | `git --version`                       |

> [!TIP]
> Nếu chưa có `pnpm`, bạn có thể cài nhanh thông qua Corepack của Node.js:
>
> ```powershell
> corepack enable
> corepack prepare pnpm@latest --activate
> ```

---

## 2. Cấu trúc dự án (Monorepo Layout)

Dự án được tổ chức dạng Monorepo sử dụng **pnpm workspace**:

```text
AL-JAMA/
├── apps/
│   ├── api/             # Backend API (NestJS v10+, Modular Monolith, Prisma)
│   └── web/             # Frontend (React 18, Vite, Tailwind CSS, shadcn/ui)
├── packages/
│   └── shared/          # Thư viện dùng chung (Types, Constants, Utilities)
├── docker/
│   └── docker-compose.dev.yml  # Docker Compose cho PostgreSQL 15 & Redis 7
├── docs/
│   ├── requirements/    # Tài liệu BRD, Database Schema, Delivery Plan
│   └── HUONG_DAN_CHAY_DU_AN.md # File hướng dẫn này
├── .env.example         # File mẫu cấu hình biến môi trường
├── package.json         # Scripts quản lý toàn bộ monorepo
└── pnpm-workspace.yaml  # Khai báo workspace
```

---

## 3. Các bước cài đặt và khởi chạy (Quick Start)

### Bước 1: Cài đặt Dependencies

Mở terminal (PowerShell trên Windows hoặc Bash trên Linux/macOS) tại thư mục gốc dự án:

```powershell
pnpm install
```

---

### Bước 2: Cấu hình biến môi trường (`.env`)

Tạo file `.env` tại thư mục gốc bằng cách copy từ `.env.example`:

**Trên Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Trên Linux / macOS:**

```bash
cp .env.example .env
```

Nội dung `.env` mặc định phục vụ môi trường phát triển (dev):

```env
# Server Port
PORT=3000

# Database (PostgreSQL) - Khớp với cấu hình docker-compose.dev.yml
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/aljama?schema=public"

# Redis (BullMQ & Cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Authentication
JWT_SECRET=aljama-super-secret-jwt-key-2026
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="AL-JAMA <noreply@aljama.local>"

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend URLs (CORS & Vite)
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

> [!NOTE]
> Mật khẩu PostgreSQL mặc định trong `docker/docker-compose.dev.yml` là `postgrespassword`. Hãy đảm bảo `DATABASE_URL` trong file `.env` trùng khớp.

---

### Bước 3: Khởi chạy Database & Redis bằng Docker

Khởi động các container PostgreSQL 15 và Redis 7 chạy ngầm:

```powershell
docker compose -f docker/docker-compose.dev.yml up -d
```

Kiểm tra trạng thái container:

```powershell
docker compose -f docker/docker-compose.dev.yml ps
```

Cả `aljama_postgres_dev` và `aljama_redis_dev` cần ở trạng thái `healthy` hoặc `Up`.

---

### Bước 4: Khởi tạo Cơ sở dữ liệu (Prisma)

Đồng bộ Prisma Schema và tạo dữ liệu khởi tạo (seed data):

```powershell
# 1. Sinh Prisma Client
pnpm --filter api prisma:generate

# 2. Chạy migration tạo bảng trong PostgreSQL
pnpm --filter api prisma:migrate

# 3. (Tuỳ chọn) Nạp dữ liệu mẫu ban đầu
pnpm --filter api prisma:seed
```

---

### Bước 5: Khởi chạy ứng dụng (Development Mode)

Chạy đồng thời cả **Backend API** và **Frontend Web** chỉ bằng 1 lệnh duy nhất:

```powershell
pnpm dev
```

Hoặc nếu muốn chạy riêng lẻ từng ứng dụng:

```powershell
# Chỉ chạy Backend NestJS API (Port 3000, watch mode)
pnpm dev:api

# Chỉ chạy Frontend Web React + Vite (Port 5173)
pnpm dev:web
```

---

## 4. Danh sách Cổng và Đường dẫn dịch vụ

Sau khi khởi chạy thành công, truy cập các địa chỉ sau:

| Dịch vụ / Ứng dụng        | Địa chỉ URL                                                          | Mô tả                                             |
| :------------------------ | :------------------------------------------------------------------- | :------------------------------------------------ |
| **Frontend Web App**      | [http://localhost:5173](http://localhost:5173)                       | Giao diện người dùng AL-JAMA                      |
| **Backend API Root**      | [http://localhost:3000/api](http://localhost:3000/api)               | API Base URL                                      |
| **API Health Check**      | [http://localhost:3000/api/health](http://localhost:3000/api/health) | Kiểm tra trạng thái hoạt động backend             |
| **Swagger Documentation** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs)     | Tài liệu tương tác và test API trực quan          |
| **PostgreSQL Database**   | `localhost:5432`                                                     | CSDL chính (Database: `aljama`, User: `postgres`) |
| **Redis Server**          | `localhost:6379`                                                     | Message Queue (BullMQ) & Caching                  |

---

## 5. Tổng hợp các câu lệnh thường dùng (Scripts Cheatsheet)

### Quản lý vòng đời dự án

| Lệnh             | Ý nghĩa                                                              |
| :--------------- | :------------------------------------------------------------------- |
| `pnpm dev`       | Khởi chạy song song cả `api` và `web` ở chế độ development           |
| `pnpm dev:api`   | Khởi chạy chỉ Backend API (NestJS watch mode)                        |
| `pnpm dev:web`   | Khởi chạy chỉ Frontend Web (Vite HMR)                                |
| `pnpm build`     | Build toàn bộ monorepo (`packages/shared` → `apps/api` → `apps/web`) |
| `pnpm build:api` | Build gói Backend API sang `apps/api/dist`                           |
| `pnpm build:web` | Build gói Frontend Web sang `apps/web/dist`                          |
| `pnpm clean`     | Xoá toàn bộ thư mục `dist` và `node_modules` trong monorepo          |

### Kiểm tra chất lượng mã nguồn & Định dạng

| Lệnh                | Ý nghĩa                                               |
| :------------------ | :---------------------------------------------------- |
| `pnpm lint`         | Kiểm tra lỗi cú pháp và quy chuẩn mã nguồn với ESLint |
| `pnpm lint:fix`     | Tự động sửa các lỗi lint có thể fix tự động           |
| `pnpm format`       | Tự động định dạng mã nguồn theo chuẩn Prettier        |
| `pnpm format:check` | Kiểm tra các file chưa đúng định dạng Prettier        |
| `pnpm test`         | Chạy bộ kiểm thử (Unit Tests)                         |

### Thao tác Cơ sở dữ liệu (Prisma)

| Lệnh                                | Ý nghĩa                                                |
| :---------------------------------- | :----------------------------------------------------- |
| `pnpm --filter api prisma:generate` | Sinh lại TypeScript types cho Prisma Client            |
| `pnpm --filter api prisma:migrate`  | Tạo và áp dụng các migration mới vào database          |
| `pnpm --filter api prisma:studio`   | Mở giao diện web quản trị dữ liệu trực quan của Prisma |
| `pnpm --filter api prisma:seed`     | Thực thi script nạp dữ liệu mẫu ban đầu                |

### Quản lý Docker

| Lệnh                                                      | Ý nghĩa                                                      |
| :-------------------------------------------------------- | :----------------------------------------------------------- |
| `docker compose -f docker/docker-compose.dev.yml up -d`   | Khởi động PostgreSQL và Redis                                |
| `docker compose -f docker/docker-compose.dev.yml down`    | Dừng các container                                           |
| `docker compose -f docker/docker-compose.dev.yml down -v` | Dừng và **xoá toàn bộ volume dữ liệu** (reset database sạch) |
| `docker compose -f docker/docker-compose.dev.yml logs -f` | Xem log trực tiếp từ các container                           |

---

## 6. Xử lý sự cố thường gặp (Troubleshooting)

### 1. Lỗi cổng bị chiếm dụng (Port already in use)

- **Cổng 5432 (PostgreSQL)**: Nếu máy đã cài sẵn PostgreSQL cục bộ, hãy tắt service PostgreSQL của Windows/Linux hoặc đổi cổng ánh xạ trong `docker/docker-compose.dev.yml` (ví dụ `5433:5432`) và cập nhật `DATABASE_URL`.
- **Cổng 3000 (API) hoặc 5173 (Vite)**: Kiểm tra và tắt tiến trình đang chiếm cổng:
  ```powershell
  # Tìm PID đang chiếm port 3000 trên Windows
  netstat -ano | findstr :3000
  # Tắt tiến trình theo PID
  Stop-Process -Id <PID> -Force
  ```

### 2. Lỗi `Cannot find module .../apps/api/dist/main`

Xảy ra khi cache build TypeScript bị mất đồng bộ. Cách xử lý:

```powershell
# 1. Xoá cache tsbuildinfo và dist cũ
pnpm --filter api exec rimraf dist *.tsbuildinfo

# 2. Build lại thư viện shared và api
pnpm build:api

# 3. Chạy lại dev
pnpm dev
```

### 3. Lỗi PowerShell không cho phép chạy script (`PSSecurityException`)

Nếu gặp lỗi `cannot be loaded because running scripts is disabled on this system`, hãy mở PowerShell với quyền hiện tại và chạy:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 4. Lỗi kết nối CSDL khi chạy migration

- Đảm bảo Docker container `aljama_postgres_dev` đang chạy (`docker ps`).
- Đảm bảo chuỗi kết nối `DATABASE_URL` trong file `.env` có mật khẩu trùng với cấu hình trong `docker/docker-compose.dev.yml` (`postgrespassword`).
