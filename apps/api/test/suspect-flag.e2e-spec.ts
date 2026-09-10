import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { createTestingApp, seedE2EContext, cleanDatabase } from './setup-e2e';
import { PrismaService } from '../src/prisma/prisma.service';

describe('E2E: Suspect Flag 1-Level Propagation (AC-02 / QT-02)', () => {
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

  describe('Strictly 1-Level Suspect Flagging Workflow (QT-02)', () => {
    let itemAId: string; // Upstream Root
    let itemBId: string; // Downstream Level 1 (suspect: true)
    let itemCId: string; // Downstream Level 2 (connected to B)
    let itemDId: string; // Downstream Level 1 with suspectOnUpstreamChange: false
    let relABId: string; // Link A -> B
    let relBCId: string; // Link B -> C
    let relADId: string; // Link A -> D

    it('Step 1: Create 4 items across hierarchy', async () => {
      // Create Item A (Root Requirement)
      const resA = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/items`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          itemTypeId: context.itemType.id,
          name: 'Item A: Root Requirement',
          description: 'Top-level business specification',
          status: 'APPROVED',
        })
        .expect(201);
      itemAId = resA.body.data.id;

      // Create Item B (Level 1 Child Requirement)
      const resB = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/items`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          itemTypeId: context.itemType.id,
          name: 'Item B: Functional Specification',
          description: 'Detailed functional spec derived from Item A',
          status: 'DRAFT',
        })
        .expect(201);
      itemBId = resB.body.data.id;

      // Create Item C (Level 2 Grandchild / Test Case)
      const resC = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/items`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          itemTypeId: context.itemType.id,
          name: 'Item C: Verification Test Suite',
          description: 'Automated test suite verifying Item B',
          status: 'READY',
        })
        .expect(201);
      itemCId = resC.body.data.id;

      // Create Item D (Informational Link without suspect trigger)
      const resD = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/items`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          itemTypeId: context.itemType.id,
          name: 'Item D: Architecture Reference',
          description: 'Reference architecture diagram',
          status: 'DRAFT',
        })
        .expect(201);
      itemDId = resD.body.data.id;

      expect(itemAId).toBeDefined();
      expect(itemBId).toBeDefined();
      expect(itemCId).toBeDefined();
      expect(itemDId).toBeDefined();
    });

    it('Step 2: Create traceability links between items', async () => {
      // Link A -> B (suspectOnUpstreamChange: true)
      const resAB = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/relationships`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          upstreamItemId: itemAId,
          downstreamItemId: itemBId,
          relationshipTypeId: context.relationshipTypes.verifies.id,
        })
        .expect(201);
      relABId = resAB.body.data.id;
      expect(resAB.body.data.isSuspect).toBe(false);

      // Link B -> C (suspectOnUpstreamChange: true)
      const resBC = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/relationships`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          upstreamItemId: itemBId,
          downstreamItemId: itemCId,
          relationshipTypeId: context.relationshipTypes.verifies.id,
        })
        .expect(201);
      relBCId = resBC.body.data.id;
      expect(resBC.body.data.isSuspect).toBe(false);

      // Link A -> D (suspectOnUpstreamChange: false)
      const resAD = await request(app.getHttpServer())
        .post(`/api/projects/${context.project.id}/relationships`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          upstreamItemId: itemAId,
          downstreamItemId: itemDId,
          relationshipTypeId: context.relationshipTypes.related.id,
        })
        .expect(201);
      relADId = resAD.body.data.id;
      expect(resAD.body.data.isSuspect).toBe(false);
    });

    it('Step 3: Update upstream Item A -> triggers suspect flag strictly 1 level downstream', async () => {
      // Update Item A (publishes version 2 and emits item.updated)
      await request(app.getHttpServer())
        .put(`/api/items/${itemAId}`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          name: 'Item A: Root Requirement (Revised)',
          description: 'Updated requirement specs requiring review downstream',
          changeComment: 'Revised scope for Q4',
        })
        .expect(200);

      // Allow event listener to execute async handler
      await new Promise(resolve => setTimeout(resolve, 500));

      // 1. Link A -> B (Direct downstream with suspect: true) MUST be flagged as suspect!
      const linkAB = await prisma.itemRelationship.findUnique({
        where: { id: relABId },
      });
      expect(linkAB?.isSuspect).toBe(true);
      expect(linkAB?.suspectFlaggedAt).not.toBeNull();
      expect(linkAB?.suspectReason).toContain('Item updated to version 2');

      // 2. Link B -> C (Level 2 downstream) MUST NOT be flagged! (QT-02 Strictly 1-level)
      const linkBC = await prisma.itemRelationship.findUnique({
        where: { id: relBCId },
      });
      expect(linkBC?.isSuspect).toBe(false);
      expect(linkBC?.suspectFlaggedAt).toBeNull();

      // 3. Link A -> D (Direct downstream with suspectOnUpstreamChange: false) MUST NOT be flagged!
      const linkAD = await prisma.itemRelationship.findUnique({
        where: { id: relADId },
      });
      expect(linkAD?.isSuspect).toBe(false);
      expect(linkAD?.suspectFlaggedAt).toBeNull();
    });

    it('Step 4: Clear suspect flag on Link A -> B (BR-TRACE-04)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/relationships/${relABId}/clear-suspect`)
        .set('Authorization', `Bearer ${context.user2.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isSuspect).toBe(false);
      expect(res.body.data.clearedBy.id).toBe(context.user2.id);

      // Verify in DB
      const linkAB = await prisma.itemRelationship.findUnique({
        where: { id: relABId },
      });
      expect(linkAB?.isSuspect).toBe(false);
      expect(linkAB?.clearedBy).toBe(context.user2.id);
      expect(linkAB?.clearedAt).not.toBeNull();
    });

    it('Step 5: Batch clear all suspects for an item', async () => {
      // Update Item A again -> flags Link A -> B suspect again
      await request(app.getHttpServer())
        .put(`/api/items/${itemAId}`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .send({
          name: 'Item A: Root Requirement (v3)',
          changeComment: 'Minor clarification',
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 500));

      const linkABBefore = await prisma.itemRelationship.findUnique({
        where: { id: relABId },
      });
      expect(linkABBefore?.isSuspect).toBe(true);

      // Call clear-all-suspects for Item B (downstream item)
      const res = await request(app.getHttpServer())
        .patch(`/api/items/${itemBId}/clear-all-suspects`)
        .set('Authorization', `Bearer ${context.user1.token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.clearedCount).toBe(1);

      // Verify Link A -> B is cleared
      const linkABAfter = await prisma.itemRelationship.findUnique({
        where: { id: relABId },
      });
      expect(linkABAfter?.isSuspect).toBe(false);
    });
  });
});
