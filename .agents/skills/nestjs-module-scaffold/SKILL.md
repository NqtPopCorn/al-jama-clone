---
name: nestjs-module-scaffold
description: |
  Skill để tạo một NestJS module mới trong dự án AL-JAMA theo đúng cấu trúc Modular Monolith.
  Bao gồm: module, controller, service, DTOs, và Prisma model tương ứng.
  Sử dụng khi cần tạo module mới hoặc thêm sub-module vào module hiện có.
---

# NestJS Module Scaffold

## Khi nào sử dụng

- Tạo module mới cho một Epic/Feature chưa có
- Thêm sub-feature vào module hiện có (ví dụ: thêm service mới trong review module)

## Cấu trúc chuẩn cho 1 module

```
src/modules/{module-name}/
├── {module-name}.module.ts        # NestJS module definition
├── {module-name}.controller.ts    # REST endpoints
├── {module-name}.service.ts       # Business logic
├── dto/
│   ├── create-{entity}.dto.ts     # Create DTO with class-validator
│   ├── update-{entity}.dto.ts     # Update DTO (PartialType)
│   └── query-{entity}.dto.ts      # Query/filter DTO
├── entities/                       # Response types (not DB entities — Prisma handles that)
│   └── {entity}.entity.ts
├── guards/                         # Module-specific guards (if any)
│   └── {entity}-ownership.guard.ts
└── events/                         # Event payloads for cross-module communication
    └── {entity}-created.event.ts
```

## Template: Module File

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { {PascalName}Controller } from './{kebab-name}.controller';
import { {PascalName}Service } from './{kebab-name}.service';

@Module({
  imports: [PrismaModule],
  controllers: [{PascalName}Controller],
  providers: [{PascalName}Service],
  exports: [{PascalName}Service], // Export để module khác có thể inject
})
export class {PascalName}Module {}
```

## Template: Service File

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Create{PascalName}Dto } from './dto/create-{kebab-name}.dto';

@Injectable()
export class {PascalName}Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: Create{PascalName}Dto, userId: string) {
    const result = await this.prisma.{camelName}.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });

    // Emit event cho notification/audit
    this.eventEmitter.emit('{kebab-name}.created', {
      entityId: result.id,
      actorId: userId,
    });

    return result;
  }

  async findById(id: string) {
    const entity = await this.prisma.{camelName}.findUnique({
      where: { id },
    });
    if (!entity) throw new NotFoundException('{PascalName} not found');
    return entity;
  }
}
```

## Template: Controller File

```typescript
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { {PascalName}Service } from './{kebab-name}.service';
import { Create{PascalName}Dto } from './dto/create-{kebab-name}.dto';

@Controller('{kebab-name}s')
@UseGuards(JwtAuthGuard)
export class {PascalName}Controller {
  constructor(private readonly {camelName}Service: {PascalName}Service) {}

  @Post()
  create(@Body() dto: Create{PascalName}Dto, @Req() req) {
    return this.{camelName}Service.create(dto, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.{camelName}Service.findById(id);
  }
}
```

## Template: DTO File

```typescript
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class Create{PascalName}Dto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  projectId: string;
}
```

## Rules

1. **PHẢI export service** từ module để module khác inject được
2. **KHÔNG import Prisma model/repository** từ module khác — chỉ inject service đã export
3. **DTO dùng `class-validator`** — không validate thủ công trong controller
4. **Emit events** cho side-effects (notification, audit) — không gọi trực tiếp notification service
5. **Controller PHẢI có `@UseGuards(JwtAuthGuard)`** trừ auth endpoints
6. **Naming convention**: file kebab-case, class PascalCase, variable camelCase
