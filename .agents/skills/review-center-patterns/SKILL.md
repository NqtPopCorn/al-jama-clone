---
name: review-center-patterns
description: |
  Skill chuyên biệt cho module Review Center — module phức tạp nhất của AL-JAMA.
  Bao gồm state machine, revision lifecycle, permission matrix, và implementation patterns.
  Sử dụng khi implement bất kỳ feature nào liên quan Review Center (E5, E6, E7, E8).
---

# Review Center Implementation Patterns

## Khi nào sử dụng

- Implement bất kỳ feature Review Center nào (E5-E8)
- Cần hiểu state machine của review
- Cần kiểm tra permission cho review action
- Debug logic revision/baseline

## 1. Review State Machine

```
draft ──[Initiate]──▶ active ──[Close for Feedback]──▶ closed_for_feedback
                                                         │           │
                                                   [Archive]    [Finalize]
                                                         ▼           ▼
                                                     archived    finalized
                                                         │        (terminal)
                                                   [Recover]
                                                         ▼
                                                 closed_for_feedback
```

### Transition Rules (implement as guard)

```typescript
const VALID_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['CLOSED_FOR_FEEDBACK'],
  CLOSED_FOR_FEEDBACK: ['ARCHIVED', 'FINALIZED'],
  ARCHIVED: ['CLOSED_FOR_FEEDBACK'],
  FINALIZED: [], // Terminal — no transitions allowed
};

function canTransition(current: ReviewStatus, target: ReviewStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}
```

### Pre-conditions

| Transition                      | Pre-condition                                            |
| ------------------------------- | -------------------------------------------------------- |
| draft → active                  | Phải có ≥ 1 participant, ≥ 1 item                        |
| active → closed_for_feedback    | — (moderator discretion)                                 |
| closed_for_feedback → finalized | Không có item nào `rejected` ở revision hiện tại (QT-06) |
| closed_for_feedback → archived  | —                                                        |
| archived → closed_for_feedback  | — (recover)                                              |

## 2. Review Item Status — Per Participant, Per Revision

```typescript
// Reviewer: not_reviewed → reviewed (checkbox)
// Approver: not_reviewed → approved | rejected

// Khi publish revision mới:
// 1. Tăng reviews.current_revision_number
// 2. KHÔNG xóa status cũ (audit trail)
// 3. Participant bắt đầu từ not_reviewed ở revision mới
// 4. Application chỉ query theo current_revision_number
```

### Query Pattern

```typescript
// Lấy status hiện tại (chỉ revision mới nhất)
const currentStatuses = await prisma.reviewItemStatus.findMany({
  where: {
    reviewId,
    revisionNumber: review.currentRevisionNumber,
  },
});

// Lấy full history (audit)
const allStatuses = await prisma.reviewItemStatus.findMany({
  where: { reviewId },
  orderBy: [{ revisionNumber: 'asc' }, { updatedAt: 'asc' }],
});
```

## 3. Permission Matrix (Review-specific)

```typescript
type ReviewAction =
  | 'view_review'
  | 'comment'
  | 'mark_reviewed' // Reviewer only
  | 'approve_reject' // Approver only
  | 'add_participant' // Moderator only
  | 'edit_item_in_review' // Moderator only
  | 'publish_revision' // Moderator only
  | 'close_for_feedback' // Moderator only
  | 'archive_recover' // Moderator only
  | 'finalize' // Moderator only
  | 'sign'; // Approver with is_signer = true

const REVIEW_PERMISSIONS: Record<ReviewRole, ReviewAction[]> = {
  moderator: [
    'view_review',
    'comment',
    'add_participant',
    'edit_item_in_review',
    'publish_revision',
    'close_for_feedback',
    'archive_recover',
    'finalize',
  ],
  approver: [
    'view_review',
    'comment',
    'approve_reject',
    // 'sign' — only if is_signer = true
  ],
  reviewer: ['view_review', 'comment', 'mark_reviewed'],
};
```

## 4. Revision Lifecycle

```
1. Moderator tạo review (draft)
   └── revision_number = 0 (chưa initiate)

2. Moderator Initiate → review = active
   └── revision_number = 1
   └── Tạo review_revisions row
   └── Tạo review_baselines (trigger = review_initiate)
   └── Gửi email cho tất cả participant

3. Participants review, comment, approve/reject
   └── Tạo review_item_status rows (revision = 1)
   └── Tạo review_comments

4. Moderator sửa item (pending updates)
   └── item_versions tăng
   └── pending_count++ (computed, không lưu DB)

5. Moderator Publish New Revision
   └── revision_number = 2
   └── Tạo review_revisions row
   └── Tạo review_baselines (trigger = revision_publish)
   └── Gửi email cho tất cả participant
   └── Participant bắt đầu lại từ not_reviewed ở revision 2

6. Repeat 3-5 cho tới khi OK

7. Moderator Close for Feedback
   └── review.status = closed_for_feedback
   └── Chặn participant thêm comment/vote

8. Moderator Finalize (nếu approval review, không có reject)
   └── review.status = finalized
   └── Tạo baseline cuối cùng
```

## 5. Baseline Auto-creation

```typescript
async function createBaseline(
  reviewId: string,
  triggerType: 'REVIEW_INITIATE' | 'REVISION_PUBLISH',
  revisionNumber: number,
) {
  // Lấy tất cả item versions hiện tại
  const reviewItems = await prisma.reviewItem.findMany({
    where: { reviewId },
    include: { item: { select: { currentVersion: true } } },
  });

  // Snapshot item_version IDs tại thời điểm này
  const snapshotVersionIds = await Promise.all(
    reviewItems.map(async ri => {
      const version = await prisma.itemVersion.findFirst({
        where: {
          itemId: ri.itemId,
          versionNumber: ri.item.currentVersion,
        },
      });
      return version?.id;
    }),
  );

  // Lưu N rows vào review_baselines — mỗi item version 1 row (Relational architecture)
  const baselineData = snapshotVersionIds
    .filter((id): id is string => Boolean(id))
    .map(versionId => ({
      reviewId,
      triggerType,
      revisionNumber,
      itemVersionId: versionId,
    }));

  return prisma.reviewBaseline.createMany({
    data: baselineData,
  });
}
```

## 6. E-Signature Flow (Phase 4 — simplified UI)

```typescript
// Pre-conditions for signing:
// 1. Review must be in closed_for_feedback status
// 2. No items with status = rejected at current revision (QT-06)
// 3. Participant must have is_signer = true
// 4. Re-authentication required (re-enter password)

async function signReview(reviewId: string, userId: string, password: string) {
  // 1. Verify review status
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (review.status !== 'CLOSED_FOR_FEEDBACK') {
    throw new ConflictException('Review must be closed for feedback before signing');
  }

  // 2. Check no rejected items
  const rejectedCount = await prisma.reviewItemStatus.count({
    where: {
      reviewItemId: {
        in: (await prisma.reviewItem.findMany({ where: { reviewId }, select: { id: true } })).map(
          i => i.id,
        ),
      },
      revisionNumber: review.currentRevisionNumber,
      status: 'REJECTED',
    },
  });
  if (rejectedCount > 0) {
    throw new ConflictException('Cannot sign: items still rejected. Request new revision.');
  }

  // 3. Verify signer role
  const participant = await prisma.reviewParticipant.findFirst({
    where: { reviewId, userId, isSigner: true },
  });
  if (!participant) throw new ForbiddenException('Not a designated signer');

  // 4. Re-authenticate
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedException('Re-authentication failed');

  // 5. Create signature record
  return prisma.reviewSignature.create({
    data: {
      reviewId,
      userId,
      signerName: user.fullName || user.username,
      meaning: `Approved in role of ${participant.reviewRole}`,
      reauthConfirmed: true,
    },
  });
}
```

## Rules

1. **State transitions PHẢI qua service method** — không update `status` trực tiếp
2. **Mọi transition PHẢI validate pre-conditions** trước khi thực hiện
3. **Publish revision KHÔNG xóa data cũ** — chỉ tạo row mới với revision_number mới
4. **Baseline tự động tạo** khi initiate hoặc publish — không cho user tạo manual
5. **Permission check theo review_role** (moderator/approver/reviewer), KHÔNG theo project_role
6. **reviewer_limited license**: chặn ở route guard, không chỉ ẩn UI
