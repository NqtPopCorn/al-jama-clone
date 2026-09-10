import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Client } from 'pg';
import { execSync } from 'child_process';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { LicenseType, ProjectRole, ProjectStatus, UserStatus } from '@prisma/client';

export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres:postgrespassword@localhost:5432/aljama_test?schema=public';

// Set DATABASE_URL to test DB before any module loads
process.env.DATABASE_URL = TEST_DB_URL;

const ROOT_DIR = path.resolve(__dirname, '../../..');

async function checkPostgresConnection(connectionString: string): Promise<boolean> {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensures Docker PostgreSQL container is running and aljama_test database is migrated.
 * Auto-starts docker-compose if not already running (fulfilling user requirement: 'tự bật nếu chưa "up"').
 */
export async function ensureDockerAndDatabase(): Promise<void> {
  const defaultDbUrl = 'postgresql://postgres:postgrespassword@localhost:5432/aljama';
  let isRunning = await checkPostgresConnection(defaultDbUrl);

  if (!isRunning) {
    console.log(
      '⚡ PostgreSQL container not running. Starting Docker containers via docker-compose...',
    );
    try {
      execSync('docker-compose -f docker/docker-compose.dev.yml up -d', {
        cwd: ROOT_DIR,
        stdio: 'inherit',
      });
    } catch (err) {
      console.warn('docker-compose up failed, retrying with root compose:', err);
    }

    // Wait up to 30s for Postgres to become ready
    const start = Date.now();
    while (Date.now() - start < 30000) {
      await new Promise(res => setTimeout(res, 1500));
      isRunning = await checkPostgresConnection(defaultDbUrl);
      if (isRunning) break;
    }

    if (!isRunning) {
      throw new Error('PostgreSQL container failed to become ready within 30 seconds.');
    }
  }

  // Ensure aljama_test database exists
  const defaultClient = new Client({ connectionString: defaultDbUrl });
  await defaultClient.connect();
  try {
    const res = await defaultClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'aljama_test'",
    );
    if (res.rowCount === 0) {
      console.log('📦 Creating aljama_test database...');
      await defaultClient.query('CREATE DATABASE aljama_test');
    }
  } finally {
    await defaultClient.end();
  }

  // Run Prisma migrations against aljama_test
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: 'pipe',
    });
  } catch (err: any) {
    console.error('Migration failed:', err?.stderr?.toString() || err?.message);
    throw err;
  }
}

export interface E2EContext {
  app: INestApplication;
  prisma: PrismaService;
  jwtService: JwtService;
  users: {
    admin: { id: string; email: string; token: string };
    user1: { id: string; email: string; token: string };
    user2: { id: string; email: string; token: string };
  };
  project: { id: string; key: string; name: string };
  itemType: { id: string; key: string };
  relationshipTypes: {
    verifies: { id: string; name: string };
    related: { id: string; name: string };
  };
}

export async function createTestingApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
  jwtService: JwtService;
}> {
  await ensureDockerAndDatabase();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.init();

  const prisma = app.get<PrismaService>(PrismaService);
  const jwtService = app.get<JwtService>(JwtService);

  return { app, prisma, jwtService };
}

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.itemRelationship.deleteMany();
  await prisma.itemActivityLog.deleteMany();
  await prisma.itemVersion.deleteMany();
  await prisma.item.deleteMany();
  await prisma.relationshipType.deleteMany();
  await prisma.itemTypeField.deleteMany();
  await prisma.itemType.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedE2EContext(
  prisma: PrismaService,
  jwtService: JwtService,
): Promise<
  E2EContext['users'] & {
    project: E2EContext['project'];
    itemType: E2EContext['itemType'];
    relationshipTypes: E2EContext['relationshipTypes'];
  }
> {
  await cleanDatabase(prisma);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@aljama.local',
      username: 'admin',
      fullName: 'System Administrator',
      passwordHash,
      licenseType: LicenseType.FULL,
      status: UserStatus.ACTIVE,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'user1@aljama.local',
      username: 'user1',
      fullName: 'Lead Engineer',
      passwordHash,
      licenseType: LicenseType.FULL,
      status: UserStatus.ACTIVE,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@aljama.local',
      username: 'user2',
      fullName: 'Software Developer',
      passwordHash,
      licenseType: LicenseType.FULL,
      status: UserStatus.ACTIVE,
    },
  });

  // 2. Project
  const project = await prisma.project.create({
    data: {
      key: 'TEST',
      name: 'E2E Test Project',
      description: 'Project used for Phase 1 E2E tests',
      status: ProjectStatus.ACTIVE,
      createdBy: admin.id,
    },
  });

  // 3. Memberships
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id, projectRole: ProjectRole.ADMINISTRATOR },
      { projectId: project.id, userId: user1.id, projectRole: ProjectRole.MEMBER },
      { projectId: project.id, userId: user2.id, projectRole: ProjectRole.MEMBER },
    ],
  });

  // 4. Item Type
  const itemType = await prisma.itemType.create({
    data: {
      projectId: project.id,
      key: 'REQ',
      name: 'System Requirement',
      icon: 'file-text',
    },
  });

  // 5. Relationship Types
  const verifies = await prisma.relationshipType.create({
    data: {
      projectId: project.id,
      name: 'Verifies',
      inverseName: 'Is Verified By',
      isRequiredDefault: false,
      suspectOnUpstreamChange: true, // QT-02 enabled
    },
  });

  const related = await prisma.relationshipType.create({
    data: {
      projectId: project.id,
      name: 'Related To',
      inverseName: 'Related To',
      isRequiredDefault: false,
      suspectOnUpstreamChange: false, // QT-02 disabled
    },
  });

  // 6. JWT Tokens
  const signToken = (u: typeof admin) =>
    jwtService.sign({
      sub: u.id,
      email: u.email,
      username: u.username,
      licenseType: u.licenseType,
    });

  return {
    admin: { id: admin.id, email: admin.email, token: signToken(admin) },
    user1: { id: user1.id, email: user1.email, token: signToken(user1) },
    user2: { id: user2.id, email: user2.email, token: signToken(user2) },
    project: { id: project.id, key: project.key, name: project.name },
    itemType: { id: itemType.id, key: itemType.key },
    relationshipTypes: {
      verifies: { id: verifies.id, name: verifies.name },
      related: { id: related.id, name: related.name },
    },
  };
}
