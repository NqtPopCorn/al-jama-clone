import {
  PrismaClient,
  ReviewStatus,
  ReviewRole,
  ReviewTemplateType,
  ReviewItemStatusValue,
  ReviewCommentLabel,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function seedReviews() {
  console.log('📋 [REVIEW SEED] Seeding sample review records matching Jama Connect screens...');

  // 1. Lấy project và users
  const project = await prisma.project.findFirst({
    where: { key: 'MED' },
  });

  if (!project) {
    console.error('❌ Project MED not found. Please run main dev seed first.');
    return;
  }

  const adminUser = await prisma.user.findUnique({ where: { username: 'admin' } });
  const memberUser = await prisma.user.findUnique({ where: { username: 'member' } });
  const reviewerUser = await prisma.user.findUnique({ where: { username: 'reviewer' } });

  if (!adminUser || !memberUser || !reviewerUser) {
    console.error('❌ Required users (admin, member, reviewer) not found.');
    return;
  }

  // 2. Tìm hoặc tạo Review Templates
  let peerTemplate = await prisma.reviewTemplate.findFirst({
    where: { projectId: project.id, type: ReviewTemplateType.PEER },
  });
  if (!peerTemplate) {
    peerTemplate = await prisma.reviewTemplate.create({
      data: {
        projectId: project.id,
        name: 'Peer Review',
        type: ReviewTemplateType.PEER,
        requiresSignature: false,
        enableTimeTracking: true,
        allowApproverAddParticipant: true,
        allowDelegate: true,
        isEditableOnCreate: true,
        createdBy: adminUser.id,
      },
    });
  }

  let approvalTemplate = await prisma.reviewTemplate.findFirst({
    where: { projectId: project.id, type: ReviewTemplateType.APPROVAL },
  });
  if (!approvalTemplate) {
    approvalTemplate = await prisma.reviewTemplate.create({
      data: {
        projectId: project.id,
        name: 'Approval Review',
        type: ReviewTemplateType.APPROVAL,
        requiresSignature: true,
        enableTimeTracking: true,
        allowApproverAddParticipant: false,
        allowDelegate: false,
        isEditableOnCreate: false,
        createdBy: adminUser.id,
      },
    });
  }

  // 3. Lấy item type Use Case hoặc Requirement
  let ucType = await prisma.itemType.findFirst({
    where: { projectId: project.id, key: 'UC' },
  });
  if (!ucType) {
    ucType = await prisma.itemType.findFirst({
      where: { projectId: project.id },
    });
  }

  // Tạo thêm các use case items đặc thù cho Screen 2 & 3 nếu chưa có
  const sampleUseCasesData = [
    {
      key: '2.1',
      name: 'Use Cases',
      description:
        'Parent set containing functional use case specifications for clinical workflow.',
      customFields: { actor: 'Clinical Staff & System Administrator' },
    },
    {
      key: '2.1.1',
      name: 'Schedule Patient Appointment',
      description: 'Workflow specification for scheduling patient visits and procedures.',
      customFields: {
        actor: 'Receptionist',
        Trigger:
          'Patient needs an appointment. Can be initiated by phone during appointment or after appointment completed.',
        'Primary Flow':
          "1. Receptionist receives call and searches for patient.\n2. System finds patient and loads summary info.\n3. Receptionist searches for appointments based on sur info or patient's suggestions.\n4. System returns found appointments. 5 options at a time and hour order\n5. Receptionist selects time indicated by patient.\n6. System inserts patient into appointment and blocks time. Procedure, dentist and notes are referenced.",
        'Alternate Flow':
          '1. Receptionist places call\n2. System does not find patient\n3. Error message served',
        Assumptions: 'Terminal is connected to network',
      },
    },
    {
      key: '2.1.2',
      name: 'Perform Patient Procedure',
      description: 'Operating steps during clinical dental procedure.',
      customFields: {
        actor: 'Clinician / Dentist',
        Trigger: 'Patient is seated in operatory room with sterilized tools prepared.',
        'Primary Flow':
          '1. Clinician reviews patient history.\n2. Clinician records treatment code and marks tooth or tooth region treated.\n3. System verifies procedure compatibility with insurance plan.',
        Assumptions: 'Operatory computer logged in with provider credentials',
      },
    },
    {
      key: '2.1.3',
      name: 'Bill Insurance Provider',
      description: 'Submission of claims to carrier via EDI 837 transaction.',
      customFields: {
        actor: 'Billing Specialist',
        Trigger: 'Treatment marked completed by attending provider.',
        'Primary Flow':
          '1. Generate claim form CMS-1500.\n2. Validate procedure code against fee schedule.',
      },
    },
    {
      key: '2.1.4',
      name: 'Add X-Ray Results',
      description: 'DICOM imaging upload and attachment.',
      customFields: { actor: 'Radiology Technician' },
    },
    {
      key: '2.1.5',
      name: 'Update Admin Password',
      description: 'Credential lifecycle security.',
      customFields: { actor: 'System Administrator' },
    },
    {
      key: '2.1.6',
      name: 'Update Patient Bills',
      description: 'Adjustment of copay and balance.',
      customFields: { actor: 'Billing Specialist' },
    },
    {
      key: '2.1.7',
      name: 'Print out Insurer Bills',
      description: 'Paper statement generation.',
      customFields: { actor: 'Billing Specialist' },
    },
    {
      key: '2.1.8',
      name: 'Search available dates',
      description: 'Calendar query optimization.',
      customFields: { actor: 'Receptionist' },
    },
    {
      key: '2.1.9',
      name: 'Attach Note',
      description: 'Clinical encounter progress note.',
      customFields: { actor: 'Attending Clinician' },
    },
    {
      key: '2.1.10',
      name: 'Upload to Share-D',
      description: 'Cloud repository synchronization.',
      customFields: { actor: 'IT Support' },
    },
    {
      key: '2.1.11',
      name: 'Download from Share-D',
      description: 'Retrieve archived historical chart.',
      customFields: { actor: 'Clinician' },
    },
    {
      key: '2.1.12',
      name: 'Manage Patient Information',
      description: 'Demographics and consent.',
      customFields: { actor: 'Receptionist' },
    },
    {
      key: '2.1.13',
      name: 'Login as employee',
      description: 'Role-based access verification.',
      customFields: { actor: 'Employee' },
    },
  ];

  const createdItems = [];
  for (const uc of sampleUseCasesData) {
    let item = await prisma.item.findUnique({
      where: { itemKey: `MED-UC-${uc.key}` },
    });
    if (!item) {
      item = await prisma.item.create({
        data: {
          projectId: project.id,
          itemTypeId: ucType!.id,
          itemKey: `MED-UC-${uc.key}`,
          name: uc.name,
          description: uc.description,
          customFields: uc.customFields || {},
          status: 'In Review',
          priority: 'High',
          currentVersion: 2,
          createdBy: adminUser.id,
        },
      });

      // Tạo ItemVersion
      await prisma.itemVersion.create({
        data: {
          itemId: item.id,
          versionNumber: 1,
          snapshot: item as any,
          changeComment: 'Initial version',
          changedBy: adminUser.id,
        },
      });
      await prisma.itemVersion.create({
        data: {
          itemId: item.id,
          versionNumber: 2,
          snapshot: item as any,
          changeComment: 'Updated appointment rules and procedure details',
          changedBy: adminUser.id,
        },
      });
    }
    createdItems.push(item);
  }

  // 4. REVIEW 1: "Set: Use Cases - V2" (Matching Screenshots 2, 3, 4, 5)
  let review1 = await prisma.review.findFirst({
    where: { projectId: project.id, name: 'Set: Use Cases - V2' },
  });

  if (!review1) {
    review1 = await prisma.review.create({
      data: {
        projectId: project.id,
        templateId: peerTemplate.id,
        name: 'Set: Use Cases - V2',
        description:
          'Comprehensive review of medical clinic use cases and flow requirements for release V2.',
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 2,
        includeContext: true,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        createdBy: adminUser.id,
      },
    });

    // Revisions
    await prisma.reviewRevision.create({
      data: {
        reviewId: review1.id,
        revisionNumber: 1,
        changeDescription: 'Initial draft of use cases set',
        publishedBy: adminUser.id,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    });
    await prisma.reviewRevision.create({
      data: {
        reviewId: review1.id,
        revisionNumber: 2,
        changeDescription:
          'Published revision 2 incorporating clinical feedback and flow adjustments',
        publishedBy: adminUser.id,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });

    // Participants
    await prisma.reviewParticipant.createMany({
      data: [
        {
          reviewId: review1.id,
          userId: adminUser.id,
          reviewRole: ReviewRole.MODERATOR,
          isSigner: true,
        },
        {
          reviewId: review1.id,
          userId: memberUser.id,
          reviewRole: ReviewRole.APPROVER,
          isSigner: true,
        },
        {
          reviewId: review1.id,
          userId: reviewerUser.id,
          reviewRole: ReviewRole.REVIEWER,
          isSigner: false,
        },
      ],
    });

    const r1Participants = await prisma.reviewParticipant.findMany({
      where: { reviewId: review1.id },
    });
    const adminPart = r1Participants.find(p => p.userId === adminUser.id);
    const memberPart = r1Participants.find(p => p.userId === memberUser.id);
    const reviewerPart = r1Participants.find(p => p.userId === reviewerUser.id);

    // Review Items
    for (let i = 0; i < createdItems.length; i++) {
      const ri = await prisma.reviewItem.create({
        data: {
          reviewId: review1.id,
          itemId: createdItems[i].id,
          orderIndex: i + 1,
        },
      });

      // Item statuses
      await prisma.reviewItemStatus.createMany({
        data: [
          {
            reviewItemId: ri.id,
            participantId: adminPart!.id,
            userId: adminUser.id,
            revisionNumber: 2,
            status: i < 3 ? ReviewItemStatusValue.APPROVED : ReviewItemStatusValue.NOT_REVIEWED,
          },
          {
            reviewItemId: ri.id,
            participantId: memberPart!.id,
            userId: memberUser.id,
            revisionNumber: 2,
            status: i === 0 ? ReviewItemStatusValue.APPROVED : ReviewItemStatusValue.NOT_REVIEWED,
          },
          {
            reviewItemId: ri.id,
            participantId: reviewerPart!.id,
            userId: reviewerUser.id,
            revisionNumber: 2,
            status: i < 2 ? ReviewItemStatusValue.REVIEWED : ReviewItemStatusValue.NOT_REVIEWED,
          },
        ],
      });

      // Tạo comments mẫu cho các items đầu tiên (khớp Screen 4 & 5)
      if (i === 0) {
        // Item 2.1 Use Cases
        await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            authorId: adminUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.GENERAL,
            content: 'Please verify all use cases reflect the updated dental surgical scope.',
          },
        });
      } else if (i === 1) {
        // Item 2.1.1 Schedule Patient Appointment (Badge 3)
        await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            authorId: reviewerUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.QUESTION,
            content:
              'Should receptionist be able to search for appointments by doctor specialty as well?',
          },
        });
        await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            authorId: memberUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.PROPOSED_CHANGE,
            content: 'Recommend adding SMS reminder trigger to primary flow step 6.',
          },
        });
        await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            authorId: adminUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.GENERAL,
            content: 'Agreed, will include SMS trigger in next revision.',
          },
        });
      } else if (i === 2) {
        // Item 2.1.2 Perform Patient Procedure (Contextual highlight comment - Screen 5!)
        const parentComment = await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            authorId: reviewerUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.ISSUE,
            selectedText: 'or tooth',
            content: "You don't really mean that the dentist writes on the tooth do you?",
          },
        });

        // Nested reply from admin/Kevin
        await prisma.reviewComment.create({
          data: {
            reviewItemId: ri.id,
            parentCommentId: parentComment.id,
            authorId: adminUser.id,
            revisionNumber: 2,
            label: ReviewCommentLabel.GENERAL,
            content:
              'It is weird to read. We should change this to "marks tooth in dental chart diagram".',
          },
        });
      }
    }
    console.log('✅ Created Review 1: "Set: Use Cases - V2" (14 items, comments, statuses)');
  }

  // 5. REVIEW 2: "Rolling Review 1" (REV-34 on Screen 1)
  let review2 = await prisma.review.findFirst({
    where: { projectId: project.id, name: 'Rolling Review 1' },
  });
  if (!review2) {
    review2 = await prisma.review.create({
      data: {
        projectId: project.id,
        templateId: approvalTemplate.id,
        name: 'Rolling Review 1',
        description: 'Continuous rolling review of safety requirements.',
        status: ReviewStatus.ACTIVE,
        currentRevisionNumber: 2,
        deadline: new Date('2026-10-26'),
        createdBy: adminUser.id,
      },
    });
    await prisma.reviewParticipant.createMany({
      data: [
        {
          reviewId: review2.id,
          userId: adminUser.id,
          reviewRole: ReviewRole.MODERATOR,
          isSigner: true,
        },
        {
          reviewId: review2.id,
          userId: memberUser.id,
          reviewRole: ReviewRole.APPROVER,
          isSigner: true,
        },
        {
          reviewId: review2.id,
          userId: reviewerUser.id,
          reviewRole: ReviewRole.REVIEWER,
          isSigner: false,
        },
      ],
    });
    await prisma.reviewItem.createMany({
      data: createdItems.slice(0, 5).map((it, idx) => ({
        reviewId: review2!.id,
        itemId: it.id,
        orderIndex: idx + 1,
      })),
    });
    console.log('✅ Created Review 2: "Rolling Review 1"');
  }

  // 6. REVIEW 3: "10/16 Risk Evaluation Demo" (REV-33 on Screen 1)
  let review3 = await prisma.review.findFirst({
    where: { projectId: project.id, name: '10/16 Risk Evaluation Demo' },
  });
  if (!review3) {
    review3 = await prisma.review.create({
      data: {
        projectId: project.id,
        templateId: approvalTemplate.id,
        name: '10/16 Risk Evaluation Demo',
        description: 'Formal risk mitigations evaluation baseline.',
        status: ReviewStatus.FINALIZED,
        finalizedAt: new Date('2026-10-06T17:00:00Z'),
        currentRevisionNumber: 2,
        deadline: new Date('2026-10-06'),
        createdBy: adminUser.id,
      },
    });
    await prisma.reviewParticipant.createMany({
      data: [
        {
          reviewId: review3.id,
          userId: adminUser.id,
          reviewRole: ReviewRole.MODERATOR,
          isSigner: true,
        },
        {
          reviewId: review3.id,
          userId: memberUser.id,
          reviewRole: ReviewRole.APPROVER,
          isSigner: true,
        },
      ],
    });
    await prisma.reviewItem.createMany({
      data: createdItems.slice(0, 4).map((it, idx) => ({
        reviewId: review3!.id,
        itemId: it.id,
        orderIndex: idx + 1,
      })),
    });
    console.log('✅ Created Review 3: "10/16 Risk Evaluation Demo" (Completed)');
  }

  // 7. REVIEW 4: "Set: QMS Docs" (REV-31 on Screen 1)
  let review4 = await prisma.review.findFirst({
    where: { projectId: project.id, name: 'Set: QMS Docs' },
  });
  if (!review4) {
    review4 = await prisma.review.create({
      data: {
        projectId: project.id,
        templateId: peerTemplate.id,
        name: 'Set: QMS Docs',
        description: 'ISO 13485 Quality Management System Standard Operating Procedures.',
        status: ReviewStatus.CLOSED_FOR_FEEDBACK,
        currentRevisionNumber: 2,
        deadline: new Date('2026-07-25'),
        createdBy: adminUser.id,
      },
    });
    await prisma.reviewParticipant.createMany({
      data: [
        {
          reviewId: review4.id,
          userId: adminUser.id,
          reviewRole: ReviewRole.MODERATOR,
          isSigner: false,
        },
        {
          reviewId: review4.id,
          userId: reviewerUser.id,
          reviewRole: ReviewRole.REVIEWER,
          isSigner: false,
        },
      ],
    });
    await prisma.reviewItem.createMany({
      data: createdItems.slice(0, 6).map((it, idx) => ({
        reviewId: review4!.id,
        itemId: it.id,
        orderIndex: idx + 1,
      })),
    });
    console.log('✅ Created Review 4: "Set: QMS Docs" (Closed for feedback)');
  }

  // 8. REVIEW 5: "Set: Project Overview" (REV-32 on Screen 1)
  let review5 = await prisma.review.findFirst({
    where: { projectId: project.id, name: 'Set: Project Overview' },
  });
  if (!review5) {
    review5 = await prisma.review.create({
      data: {
        projectId: project.id,
        templateId: peerTemplate.id,
        name: 'Set: Project Overview',
        description: 'High-level architectural overview and project charter.',
        status: ReviewStatus.FINALIZED,
        currentRevisionNumber: 4,
        deadline: new Date('2026-10-05'),
        createdBy: adminUser.id,
      },
    });
    await prisma.reviewParticipant.createMany({
      data: [
        {
          reviewId: review5.id,
          userId: adminUser.id,
          reviewRole: ReviewRole.MODERATOR,
          isSigner: false,
        },
        {
          reviewId: review5.id,
          userId: memberUser.id,
          reviewRole: ReviewRole.APPROVER,
          isSigner: false,
        },
      ],
    });
    console.log('✅ Created Review 5: "Set: Project Overview" (Completed, Rev 4)');
  }

  console.log('🎉 [REVIEW SEED] Successfully seeded review demo data matching all screens!');
}

// Chạy trực tiếp nếu gọi từ command line
if (require.main === module) {
  seedReviews()
    .catch(e => {
      console.error('❌ Error seeding reviews:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
