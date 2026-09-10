import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { createTestingApp, seedE2EContext, cleanDatabase } from './setup-e2e';
import { PrismaService } from '../src/prisma/prisma.service';

describe('E2E: Item Locking & Concurrency Control (AC-01 / QT-01)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let context: Awaited<ReturnType<typeof seedE2EContext>>;

  beforeAll(async () => {
    const testApp = await createTestingApp();
    app = testApp.app;
    prisma = testApp.prisma;
    context = await seedE2EContext(prisma, testApp.jwtService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('Full Concurrency Locking Flow (QT-01)', () => {
    let itemId: string;

    it('Step 1: User 1 creates an unlocked requirement item', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/items`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          itemTypeId: context.itemType.id,
          name: 'User Authentication Requirement',
          description: 'Initial draft for authentication specification',
          status: 'DRAFT',
          priority: 'HIGH',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.lockedBy).toBeNull();
      itemId = res.body.data.id;
    });

    it('Step 2: User 1 acquires editing lock on the item', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/items/${itemId}/lock`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedBy).toBe(context.user1.id);
      expect(res.body.data.lockedAt).toBeDefined();

      // Verify in database
      const itemInDb = await prisma.item.findUnique({ where: { id: itemId } });
      expect(itemInDb?.lockedBy).toBe(context.user1.id);
      expect(itemInDb?.lockedAt).not.toBeNull();
    });

    it('Step 3: User 2 attempts to acquire lock on the locked item -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/items/${itemId}/lock`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .expect(409);

      expect(res.body.message).toContain('Item is already locked by Lead Engineer');
    });

    it('Step 4: User 2 attempts to update the locked item -> 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .send({ name: 'Malicious / Concurrent Edit' })
        .expect(409);

      expect(res.body.message).toContain(
        'Item is currently locked by another user. Cannot overwrite.',
      );
    });

    it('Step 5: User 2 (non-admin member) attempts to unlock User 1 item -> 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/items/${itemId}/unlock`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .expect(403);

      expect(res.body.message).toContain(
        'Only the lock holder or a project administrator can unlock this item',
      );
    });

    it('Step 6: Project Administrator force-unlocks User 1 item -> 200 OK', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/items/${itemId}/unlock`)
        .set('Authorization', `Bearer ${context.admin.token}`)
        .expect(201);

      expect(res.body.success).toBe(true);

      // Verify in DB
      const itemInDb = await prisma.item.findUnique({ where: { id: itemId } });
      expect(itemInDb?.lockedBy).toBeNull();
      expect(itemInDb?.lockedAt).toBeNull();
    });

    it('Step 7: User 2 can now acquire the lock after admin unlocked it', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/items/${itemId}/lock`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedBy).toBe(context.user2.id);
    });

    it('Step 8: User 2 updates the item -> succeeds and auto-unlocks on save', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/items/${itemId}`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .send({
          name: 'Updated Specification by User 2',
          changeComment: 'Finalized specification details',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Specification by User 2');
      expect(res.body.data.currentVersion).toBe(2);

      // Verify item is automatically unlocked in database
      const itemInDb = await prisma.item.findUnique({ where: { id: itemId } });
      expect(itemInDb?.lockedBy).toBeNull();
      expect(itemInDb?.lockedAt).toBeNull();
    });
  });
});
