import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * MASTER SEED — Reference / System Data (Safe for Production)
 * ─────────────────────────────────────────────────────────────────────────────
 * Script này chỉ nạp dữ liệu tham chiếu (reference data) bắt buộc để ứng dụng
 * hoạt động đúng. KHÔNG xóa bất kỳ dữ liệu thực tế nào.
 *
 * Nguyên tắc Idempotency (an toàn khi chạy nhiều lần):
 *   - Dùng upsert() thay vì create()
 *   - Kiểm tra sự tồn tại trước khi tạo
 *   - Không bao giờ xóa dữ liệu hiện có
 *
 * Khi nào chạy:
 *   - Lần đầu setup môi trường production: `pnpm prisma:seed:master`
 *   - Khi thêm global relationship types hoặc config system mới
 *   - Sau khi merge migration có global config thay đổi
 * ─────────────────────────────────────────────────────────────────────────────
 */

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Global Relationship Types — available across all projects (projectId: null).
 * These are system-level defaults, not tied to any specific project.
 */
const GLOBAL_RELATIONSHIP_TYPES = [
  {
    name: 'Verifies',
    inverseName: 'Is Verified By',
    isRequiredDefault: false,
    suspectOnUpstreamChange: true,
  },
  {
    name: 'Satisfies',
    inverseName: 'Is Satisfied By',
    isRequiredDefault: false,
    suspectOnUpstreamChange: true,
  },
  {
    name: 'Derives From',
    inverseName: 'Is Derived By',
    isRequiredDefault: false,
    suspectOnUpstreamChange: true,
  },
  {
    name: 'Refines',
    inverseName: 'Is Refined By',
    isRequiredDefault: false,
    suspectOnUpstreamChange: true,
  },
  {
    name: 'Relates To',
    inverseName: 'Relates To',
    isRequiredDefault: false,
    suspectOnUpstreamChange: false,
  },
  {
    name: 'Conflicts With',
    inverseName: 'Conflicts With',
    isRequiredDefault: false,
    suspectOnUpstreamChange: false,
  },
  {
    name: 'Duplicates',
    inverseName: 'Is Duplicated By',
    isRequiredDefault: false,
    suspectOnUpstreamChange: false,
  },
] as const;

async function main() {
  console.log('🔧 [MASTER SEED] Seeding reference / system data...');
  console.log('✅ Safe to run on any environment — no data will be deleted.');

  // 1. Upsert Global Relationship Types (projectId: null = available to all projects)
  let createdCount = 0;
  let skippedCount = 0;

  for (const relType of GLOBAL_RELATIONSHIP_TYPES) {
    const existing = await prisma.relationshipType.findFirst({
      where: { name: relType.name, projectId: null },
    });

    if (!existing) {
      await prisma.relationshipType.create({
        data: {
          projectId: null, // Global — not tied to any project
          name: relType.name,
          inverseName: relType.inverseName,
          isRequiredDefault: relType.isRequiredDefault,
          suspectOnUpstreamChange: relType.suspectOnUpstreamChange,
        },
      });
      console.log(`  ✅ Created global relationship type: "${relType.name}"`);
      createdCount++;
    } else {
      console.log(`  ⏭️  Skipped (already exists): "${relType.name}"`);
      skippedCount++;
    }
  }

  console.log(
    `\n📊 Global Relationship Types: ${createdCount} created, ${skippedCount} skipped (idempotent).`,
  );

  // 2. Future: Add other global reference data here
  // e.g., default notification templates, system-wide audit log config, etc.

  console.log('\n🎉 [MASTER SEED] Reference data seeding complete!');
  console.log('   This seed is idempotent — safe to run again without side effects.');
}

main()
  .catch(e => {
    console.error('❌ Error during master seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
