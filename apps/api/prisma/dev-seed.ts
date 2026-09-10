import {
  PrismaClient,
  LicenseType,
  UserStatus,
  ProjectRole,
  ProjectStatus,
  FieldType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * DEV SEED — Development & Demo Data Only
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  KHÔNG BAO GIỜ CHẠY TRÊN PRODUCTION!
 *
 * Script này xóa sạch toàn bộ dữ liệu và nạp lại demo data cho môi trường
 * development/staging. Mọi dữ liệu thực tế của khách hàng sẽ BỊ MẤT.
 *
 * Để chạy reference data (bắt buộc cho production), dùng:
 *   pnpm prisma:seed:master
 * ─────────────────────────────────────────────────────────────────────────────
 */

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Explicit guard: block from running on production
const dbUrl = process.env.DATABASE_URL || '';
if (
  process.env.NODE_ENV === 'production' ||
  dbUrl.includes('prod') ||
  dbUrl.includes('rds.amazonaws.com')
) {
  console.error('❌ BLOCKED: dev-seed.ts is strictly forbidden on production environments.');
  console.error('   Use master-seed.ts for production reference data.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 [DEV SEED] Seeding AL-JAMA development database...');
  console.log('⚠️  This will WIPE ALL existing data!');

  // 1. Clean existing data in reverse order of FK dependencies
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.defectTestRunLink.deleteMany();
  await prisma.testRunStep.deleteMany();
  await prisma.testRun.deleteMany();
  await prisma.testCycle.deleteMany();
  await prisma.testPlanCase.deleteMany();
  await prisma.testPlanTester.deleteMany();
  await prisma.testPlan.deleteMany();
  await prisma.testStep.deleteMany();
  await prisma.reviewSignature.deleteMany();
  await prisma.reviewBaseline.deleteMany();
  await prisma.reviewRevision.deleteMany();
  await prisma.reviewCommentMention.deleteMany();
  await prisma.reviewComment.deleteMany();
  await prisma.reviewItemStatus.deleteMany();
  await prisma.reviewParticipant.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewTemplate.deleteMany();
  await prisma.commentAction.deleteMany();
  await prisma.commentHashtag.deleteMany();
  await prisma.commentMention.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.itemRelationship.deleteMany();
  await prisma.itemActivityLog.deleteMany();
  await prisma.itemAttachment.deleteMany();
  await prisma.itemSubscription.deleteMany();
  await prisma.itemVersion.deleteMany();
  await prisma.item.deleteMany();
  await prisma.relationshipType.deleteMany();
  await prisma.itemTypeField.deleteMany();
  await prisma.itemType.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.userGroupMember.deleteMany();
  await prisma.userGroup.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Dev Users
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', saltRounds);
  const memberPasswordHash = await bcrypt.hash('Member@123', saltRounds);
  const reviewerPasswordHash = await bcrypt.hash('Reviewer@123', saltRounds);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@aljama.local',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      licenseType: LicenseType.FULL,
      status: UserStatus.ACTIVE,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      username: 'member',
      email: 'member@aljama.local',
      passwordHash: memberPasswordHash,
      fullName: 'Alex Morgan (Project Engineer)',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      licenseType: LicenseType.FULL,
      status: UserStatus.ACTIVE,
    },
  });

  const reviewerUser = await prisma.user.create({
    data: {
      username: 'reviewer',
      email: 'reviewer@aljama.local',
      passwordHash: reviewerPasswordHash,
      fullName: 'Dr. Sarah Chen (Clinical Reviewer)',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      licenseType: LicenseType.REVIEWER_LIMITED,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('✅ Created 3 dev users (admin, member, reviewer)');

  // 3. Create Sample Project
  const project = await prisma.project.create({
    data: {
      key: 'MED',
      name: 'Medical Device Control System',
      description:
        'Infusion pump embedded safety requirement management system and ISO 13485 verification specifications.',
      status: ProjectStatus.ACTIVE,
      createdBy: adminUser.id,
    },
  });

  // 4. Project Members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: adminUser.id, projectRole: ProjectRole.ADMINISTRATOR },
      { projectId: project.id, userId: memberUser.id, projectRole: ProjectRole.MEMBER },
      { projectId: project.id, userId: reviewerUser.id, projectRole: ProjectRole.MEMBER },
    ],
  });

  // 5. Item Types
  const unType = await prisma.itemType.create({
    data: {
      projectId: project.id,
      key: 'UN',
      name: 'User Need',
      description: 'Stakeholder clinical need and operational workflow requirement',
      icon: 'Target',
      isSystem: true,
      fields: {
        create: [
          {
            fieldKey: 'clinical_stakeholder',
            fieldLabel: 'Clinical Stakeholder',
            fieldType: FieldType.TEXT,
            isRequired: true,
            displayOrder: 1,
          },
        ],
      },
    },
  });

  const reqType = await prisma.itemType.create({
    data: {
      projectId: project.id,
      key: 'REQ',
      name: 'Requirement',
      description: 'Functional or non-functional system requirement specification',
      icon: 'FileText',
      isSystem: true,
      fields: {
        create: [
          {
            fieldKey: 'safety_critical',
            fieldLabel: 'Safety Critical',
            fieldType: FieldType.DROPDOWN,
            isRequired: true,
            options: ['Yes', 'No', 'N/A'],
            displayOrder: 1,
          },
          {
            fieldKey: 'verification_method',
            fieldLabel: 'Verification Method',
            fieldType: FieldType.DROPDOWN,
            isRequired: false,
            options: ['Test', 'Analysis', 'Demonstration', 'Inspection'],
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const ucType = await prisma.itemType.create({
    data: {
      projectId: project.id,
      key: 'UC',
      name: 'Use Case',
      description: 'User interaction sequence or operational workflow scenario',
      icon: 'Layers',
      isSystem: true,
      fields: {
        create: [
          {
            fieldKey: 'actor',
            fieldLabel: 'Primary Actor',
            fieldType: FieldType.TEXT,
            isRequired: true,
            displayOrder: 1,
          },
          {
            fieldKey: 'pre_conditions',
            fieldLabel: 'Pre-conditions',
            fieldType: FieldType.RICHTEXT,
            isRequired: false,
            displayOrder: 2,
          },
        ],
      },
    },
  });

  const tcType = await prisma.itemType.create({
    data: {
      projectId: project.id,
      key: 'TC',
      name: 'Test Case',
      description: 'Verification step procedure and acceptance criteria',
      icon: 'CheckSquare',
      isSystem: true,
      fields: {
        create: [
          {
            fieldKey: 'test_type',
            fieldLabel: 'Test Type',
            fieldType: FieldType.DROPDOWN,
            isRequired: true,
            options: ['Unit', 'Integration', 'System', 'Regression'],
            displayOrder: 1,
          },
        ],
      },
    },
  });

  // 6. Relationship Types
  const relVerifies = await prisma.relationshipType.create({
    data: {
      projectId: project.id,
      name: 'Verifies',
      inverseName: 'Verified by',
      isRequiredDefault: true,
      suspectOnUpstreamChange: true,
    },
  });

  const relSatisfies = await prisma.relationshipType.create({
    data: {
      projectId: project.id,
      name: 'Satisfies',
      inverseName: 'Satisfied by',
      isRequiredDefault: true,
      suspectOnUpstreamChange: true,
    },
  });

  const relRelates = await prisma.relationshipType.create({
    data: {
      projectId: project.id,
      name: 'Relates to',
      inverseName: 'Related to',
      isRequiredDefault: false,
      suspectOnUpstreamChange: false,
    },
  });

  // 7. Folders
  const folderNeeds = await prisma.folder.create({
    data: { projectId: project.id, name: '0. User Needs & Clinical Specs', orderIndex: 0 },
  });
  const folderReq = await prisma.folder.create({
    data: { projectId: project.id, name: '1. System Requirements', orderIndex: 1 },
  });
  const folderAlarms = await prisma.folder.create({
    data: {
      projectId: project.id,
      parentFolderId: folderReq.id,
      name: '1.1 Safety & Alarms',
      orderIndex: 0,
    },
  });
  const folderArch = await prisma.folder.create({
    data: { projectId: project.id, name: '2. Software Architecture', orderIndex: 1 },
  });
  const folderTesting = await prisma.folder.create({
    data: { projectId: project.id, name: '3. Verification & Validation', orderIndex: 2 },
  });

  console.log('✅ Created folder tree (5 folders)');

  // 8. Sample Items
  const item0 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderNeeds.id,
      itemTypeId: unType.id,
      itemKey: 'MED-UN-001',
      name: 'Continuous Bedside Infusion During Patient Transport',
      description:
        '<p>Clinical staff requires the infusion workstation to maintain continuous, uninterrupted medicine delivery without restart delays when transporting patients between hospital departments.</p>',
      status: 'Approved',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: { clinical_stakeholder: 'Head of Anesthesiology & ICU' },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item0.id,
      versionNumber: 1,
      snapshot: item0 as any,
      changeComment: 'Initial clinical baseline creation',
      changedBy: adminUser.id,
    },
  });

  const item1 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderReq.id,
      itemTypeId: reqType.id,
      itemKey: 'MED-REQ-001',
      name: 'Battery Backup Operation',
      description:
        '<p>The infusion pump shall operate on internal battery backup for at least <strong>4 continuous hours</strong> upon sudden loss of AC mains power.</p>',
      status: 'Approved',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: { safety_critical: 'Yes', verification_method: 'Test' },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item1.id,
      versionNumber: 1,
      snapshot: item1 as any,
      changeComment: 'Initial baseline creation',
      changedBy: adminUser.id,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderReq.id,
      itemTypeId: reqType.id,
      itemKey: 'MED-REQ-002',
      name: 'Air-in-Line Detection Threshold',
      description:
        '<p>The optical bubble detection sensor shall detect any single air bubble volume exceeding <strong>50 microliters</strong> and halt liquid infusion within 100ms.</p>',
      status: 'Draft',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: { safety_critical: 'Yes', verification_method: 'Test' },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item2.id,
      versionNumber: 1,
      snapshot: item2 as any,
      changeComment: 'Initial baseline creation',
      changedBy: adminUser.id,
    },
  });

  const item3 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderAlarms.id,
      itemTypeId: reqType.id,
      itemKey: 'MED-REQ-003',
      name: 'Occlusion Audio-Visual Alarm Signaling',
      description:
        '<p>An audible alarm signal of at least <strong>65 dBA at 1 meter</strong> and flashing red LED beacon shall trigger within 5 seconds of downstream occlusion detection.</p>',
      status: 'In Review',
      priority: 'Medium',
      assigneeId: memberUser.id,
      customFields: { safety_critical: 'Yes', verification_method: 'Demonstration' },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item3.id,
      versionNumber: 1,
      snapshot: item3 as any,
      changeComment: 'Initial baseline creation',
      changedBy: adminUser.id,
    },
  });

  const item4 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderArch.id,
      itemTypeId: ucType.id,
      itemKey: 'MED-UC-001',
      name: 'Initialize Infusion Session',
      description:
        '<p>Clinical staff logs into device terminal, scans patient barcode ID, verifies drug library profile, and initiates programmed titration flow.</p>',
      status: 'Approved',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: {
        actor: 'Clinical Nurse',
        pre_conditions: '<p>Device successfully completed self-test diagnostics.</p>',
      },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item4.id,
      versionNumber: 1,
      snapshot: item4 as any,
      changeComment: 'Initial baseline creation',
      changedBy: adminUser.id,
    },
  });

  const item5 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderTesting.id,
      itemTypeId: tcType.id,
      itemKey: 'MED-TC-001',
      name: 'Verify Battery Discharge Curve at Maximum Load',
      description:
        '<p>Disconnect AC power while pump runs at 1200 mL/hr against 10 psi backpressure. Record operational endurance until low-battery warning tone fires.</p>',
      status: 'Draft',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: { test_type: 'System' },
      currentVersion: 1,
      createdBy: adminUser.id,
      updatedBy: adminUser.id,
    },
  });
  await prisma.itemVersion.create({
    data: {
      itemId: item5.id,
      versionNumber: 1,
      snapshot: item5 as any,
      changeComment: 'Initial baseline creation',
      changedBy: adminUser.id,
    },
  });

  console.log('✅ Created 6 sample items with version history');

  // 9. Traceability Relationships
  await prisma.itemRelationship.create({
    data: {
      projectId: project.id,
      upstreamItemId: item0.id,
      downstreamItemId: item1.id,
      relationshipTypeId: relSatisfies.id,
      isSuspect: false,
      createdBy: adminUser.id,
    },
  });
  await prisma.itemRelationship.create({
    data: {
      projectId: project.id,
      upstreamItemId: item1.id,
      downstreamItemId: item5.id,
      relationshipTypeId: relVerifies.id,
      isSuspect: false,
      createdBy: adminUser.id,
    },
  });
  await prisma.itemRelationship.create({
    data: {
      projectId: project.id,
      upstreamItemId: item1.id,
      downstreamItemId: item4.id,
      relationshipTypeId: relSatisfies.id,
      isSuspect: false,
      createdBy: adminUser.id,
    },
  });
  await prisma.itemRelationship.create({
    data: {
      projectId: project.id,
      upstreamItemId: item1.id,
      downstreamItemId: item2.id,
      relationshipTypeId: relRelates.id,
      isSuspect: false,
      createdBy: adminUser.id,
    },
  });
  await prisma.itemRelationship.create({
    data: {
      projectId: project.id,
      upstreamItemId: item2.id,
      downstreamItemId: item5.id,
      relationshipTypeId: relVerifies.id,
      isSuspect: true,
      suspectFlaggedAt: new Date(),
      suspectReason: 'Upstream item modified (new version published)',
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Created 5 traceability relationships (1 suspect demo)');
  console.log('🎉 [DEV SEED] Completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during dev seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
