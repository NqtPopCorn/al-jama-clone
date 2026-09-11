---
name: docker-deployment
description: |
  Skill để cấu hình Docker Compose cho development và production deployment.
  Bao gồm: multi-stage Dockerfile, docker-compose.yml cho dev/prod,
  PostgreSQL, Redis, MinIO setup, và health check patterns.
---

# Docker Deployment — AL-JAMA

## Khi nào sử dụng

- Setup Docker Compose cho development environment
- Chuẩn bị production deployment
- Thêm service mới vào Docker stack
- Debug container issues

## Development Docker Compose

```yaml
# docker/docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: aljama-postgres
    environment:
      POSTGRES_DB: aljama
      POSTGRES_USER: aljama_user
      POSTGRES_PASSWORD: aljama_dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U aljama_user -d aljama']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: aljama-redis
    ports:
      - '6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: aljama-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000' # API
      - '9001:9001' # Console
    volumes:
      - minio_data:/data

  # Mailpit (local mock SMTP & web inbox for BullMQ emails)
  mailpit:
    image: axllent/mailpit:latest
    container_name: aljama-mailpit
    restart: unless-stopped
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI
    volumes:
      - mailpit_data:/data

  # pgAdmin (optional — dev tool)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: aljama-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@aljama.dev
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  mailpit_data:
  minio_data:
```

## Production Docker Compose

```yaml
# docker/docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    container_name: aljama-api
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://aljama_user:${DB_PASSWORD}@postgres:5432/aljama?schema=public
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
      - MINIO_ENDPOINT=minio
    ports:
      - '3000:3000'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    container_name: aljama-web
    ports:
      - '80:80'
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: aljama
      POSTGRES_USER: aljama_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U aljama_user -d aljama']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

## API Dockerfile (Multi-stage)

```dockerfile
# docker/Dockerfile.api
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter api... --filter shared

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter shared build
RUN pnpm --filter api prisma generate
RUN pnpm --filter api build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Web Dockerfile (Multi-stage)

```dockerfile
# docker/Dockerfile.web
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter web... --filter shared

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter shared build
RUN pnpm --filter web build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Config

```nginx
# docker/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://api:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://api:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Commands

```bash
# Development (chỉ infrastructure, code chạy local)
docker compose -f docker/docker-compose.dev.yml up -d

# Production
docker compose -f docker/docker-compose.prod.yml --env-file .env.prod up -d --build

# Logs
docker compose -f docker/docker-compose.prod.yml logs -f api

# Run migrations in container
docker compose exec api npx prisma migrate deploy

# Seed in container
docker compose exec api npx prisma db seed
```

## Rules

1. **Dev: chỉ chạy infrastructure** (postgres, redis, minio) — code chạy local với HMR
2. **Prod: multi-stage build** — giảm image size, tách build dependencies
3. **KHÔNG lưu secrets trong docker-compose** — dùng `.env` file hoặc Docker secrets
4. **Health checks BẮT BUỘC** cho postgres và redis — `depends_on` condition dùng `service_healthy`
5. **Volume cho persistent data** — postgres_data, minio_data
6. **Nginx reverse proxy** — SPA routing + API proxy + WebSocket proxy
