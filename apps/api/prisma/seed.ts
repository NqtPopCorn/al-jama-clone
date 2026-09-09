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

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding AL-JAMA database...');

  // 1. Clean existing data in reverse order of dependencies
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

  // 2. Create Users
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

  console.log('✅ Created 3 test users (admin, member, reviewer)');

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

  console.log(`✅ Created project: ${project.key} - ${project.name}`);

  // 4. Assign Project Members
  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        userId: adminUser.id,
        projectRole: ProjectRole.ADMINISTRATOR,
      },
      {
        projectId: project.id,
        userId: memberUser.id,
        projectRole: ProjectRole.MEMBER,
      },
      {
        projectId: project.id,
        userId: reviewerUser.id,
        projectRole: ProjectRole.MEMBER,
      },
    ],
  });

  console.log('✅ Assigned project members with roles');

  // 5. Create Item Types (Requirement, Use Case, Test Case — Q5 confirmed)
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

  console.log('✅ Created 3 Item Types (REQ, UC, TC) with custom fields');

  // 6. Create Relationship Types (Forward/Inverse phrases, required/optional defaults)
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

  console.log('✅ Created 3 Relationship Types');

  // 7. Create Folders (Tree Explorer hierarchy)
  const folderReq = await prisma.folder.create({
    data: {
      projectId: project.id,
      name: '1. System Requirements',
      orderIndex: 0,
    },
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
    data: {
      projectId: project.id,
      name: '2. Software Architecture',
      orderIndex: 1,
    },
  });

  const folderTesting = await prisma.folder.create({
    data: {
      projectId: project.id,
      name: '3. Verification & Validation',
      orderIndex: 2,
    },
  });

  console.log('✅ Created Explorer Folder tree');

  // 8. Create Sample Items
  // REQ-001
  const item1 = await prisma.item.create({
    data: {
      projectId: project.id,
      folderId: folderReq.id,
      itemTypeId: reqType.id,
      itemKey: 'MED-REQ-001',
      name: 'Battery Backup Operation',
      description:
        '<p>The infusion pump shall operate on internal battery backup for at least <strong>4 continuous hours</strong> upon sudden loss of AC mains power, while maintaining nominal delivery accuracy within ±5%.</p>',
      status: 'Approved',
      priority: 'High',
      assigneeId: memberUser.id,
      customFields: {
        safety_critical: 'Yes',
        verification_method: 'Test',
      },
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

  // REQ-002
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
      customFields: {
        safety_critical: 'Yes',
        verification_method: 'Test',
      },
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

  // REQ-003 (in subfolder)
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
      customFields: {
        safety_critical: 'Yes',
        verification_method: 'Demonstration',
      },
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

  // UC-001 (in Architecture)
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

  // TC-001 (in Testing)
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
      customFields: {
        test_type: 'System',
      },
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

  console.log('✅ Created 5 sample items across folders with versions');

  // 9. Create Traceability Relationship: REQ-001 (Upstream) -> TC-001 (Downstream)
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

  console.log('✅ Linked REQ-001 --(Verifies)--> TC-001');
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch(e => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
