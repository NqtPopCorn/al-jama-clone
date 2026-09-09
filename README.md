# AL-JAMA — Requirements Management System (JAMA Connect Clone)

> **Hệ thống Quản lý Yêu cầu Doanh nghiệp, Truy vết Quan hệ, Review & Cộng tác** — Xây dựng theo kiến trúc Modular Monolith.

---

## 📖 Tài liệu dự án

- 🚀 **[Hướng dẫn cài đặt & chạy dự án chi tiết (Quick Start Guide)](file:///h:/qtruongbackup/download/ThucTap/AL-JAMA/docs/HUONG_DAN_CHAY_DU_AN.md)**
- 🌿 **[Quy trình làm việc Git & Branching (Git Flow)](file:///h:/qtruongbackup/download/ThucTap/AL-JAMA/docs/GIT_FLOW.md)**
- 📋 **[Business Requirements Document (BRD)](file:///h:/qtruongbackup/download/ThucTap/AL-JAMA/docs/requirements/BRD_He_thong_Quan_ly_Yeu_cau_MVP.md)**
- 🗄️ **[Database Schema Design](file:///h:/qtruongbackup/download/ThucTap/AL-JAMA/docs/requirements/Database_Schema_JAMA_Clone_MVP.md)**
- 🗺️ **[MVP Delivery Plan & Roadmap](file:///h:/qtruongbackup/download/ThucTap/AL-JAMA/docs/requirements/MVP_Delivery_Plan_JAMA_Clone.md)**

---

## ⚡ Khởi chạy nhanh (Quick Start)

### 1. Cài đặt dependencies

```powershell
pnpm install
```

### 2. Cấu hình môi trường

```powershell
Copy-Item .env.example .env
```

### 3. Khởi chạy cơ sở dữ liệu & cache (PostgreSQL + Redis)

```powershell
docker compose -f docker/docker-compose.dev.yml up -d
```

### 4. Khởi chạy ứng dụng (Development)

```powershell
pnpm dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3000/api](http://localhost:3000/api)
- **Swagger Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần           | Công nghệ                                 |
| :------------------- | :---------------------------------------- |
| **Monorepo**         | pnpm workspace                            |
| **Backend**          | NestJS v10+, TypeScript, Modular Monolith |
| **Database & ORM**   | PostgreSQL 15+, Prisma ORM                |
| **Queue & Cache**    | Redis 7, BullMQ                           |
| **Real-time**        | Socket.io                                 |
| **Frontend**         | React 18, Vite, TypeScript                |
| **UI Framework**     | Tailwind CSS, Radix UI, Lucide Icons      |
| **State Management** | TanStack Query v5, Zustand                |
