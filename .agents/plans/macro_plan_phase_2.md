# PHASE 2 PLAN — AL-JAMA

## Collaboration (Stream) & Review Center Cơ Bản

### Epics: E4 (Cộng tác) + E5 (Review: Khởi tạo) + E6 (Review: Thực hiện)

**Ngày lập:** 10/09/2026
**Căn cứ:** `BRD_He_thong_Quan_ly_Yeu_cau_MVP.md` v1.0, `Database_Schema_JAMA_Clone_MVP.md`, `MVP_Delivery_Plan_JAMA_Clone.md` v1.0, `.agents/AGENTS.md`, `.agents/skills/review-center-patterns/SKILL.md`, trạng thái source code hiện tại.

---

## 0. Căn cứ lập kế hoạch — Trạng thái hiện tại của hệ thống

Trước khi lập kế hoạch Phase 2, tôi đối chiếu lại những gì đã tồn tại trong codebase (không giả định lại):

| Hạng mục                                              | Trạng thái                                                                                                                                                                                                                                                                                                                       | Bằng chứng                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Phase 1 (E0+E1+E2+E3)                                 | **Đã hoàn thành**, đã qua nghiệm thu (39/39 unit test, 13/13 E2E)                                                                                                                                                                                                                                                                | `macro_plan_phase_1.md` — Milestone 1.5 [COMPLETED]                                                   |
| Auth, User, Project, Item, Traceability modules       | Đã code đầy đủ (controller/service/DTO/guard)                                                                                                                                                                                                                                                                                    | `apps/api/src/modules/{auth,user,project,item,traceability}`                                          |
| Suspect Flag 1-cấp (QT-02)                            | Đã implement + test đầy đủ (unit + E2E)                                                                                                                                                                                                                                                                                          | `traceability.service.ts`, `traceability-event.listener.ts`, `suspect-flag.e2e-spec.ts`               |
| Item Locking (QT-01)                                  | Đã implement + test đầy đủ                                                                                                                                                                                                                                                                                                       | `item.service.ts` (`lockItem`/`unlockItem`), `item-locking.e2e-spec.ts`                               |
| **Database schema cho Collaboration & Review Center** | ✅ **Đã có sẵn trong Prisma schema và migration** (`comments`, `comment_mentions`, `comment_hashtags`, `comment_actions`, `review_templates`, `reviews`, `review_items`, `review_participants`, `review_item_status`, `review_comments`, `review_comment_mentions`, `review_revisions`, `review_baselines`, `review_signatures`) | `schema.prisma`, migration `20260909090552_init_database_schema`                                      |
| **NestJS module cho `collaboration`**                 | ❌ **Chưa tồn tại** — không có `apps/api/src/modules/collaboration/`                                                                                                                                                                                                                                                             | Không thấy trong cấu trúc source                                                                      |
| **NestJS module cho `review`**                        | ❌ **Chưa tồn tại** — không có `apps/api/src/modules/review/`                                                                                                                                                                                                                                                                    | Không thấy trong cấu trúc source                                                                      |
| **NestJS module cho `notification`**                  | ❌ **Chưa tồn tại** — bảng `notifications` có trong schema nhưng chưa có service gửi email thật                                                                                                                                                                                                                                  | Không thấy trong cấu trúc source                                                                      |
| React feature `traceability`, `item`                  | Đã có UI đầy đủ (TraceView, ItemDetailView, drawers...)                                                                                                                                                                                                                                                                          | `apps/web/src/features/{item,traceability}`                                                           |
| React feature `review`, `collaboration` (Stream)      | ❌ Chưa tồn tại                                                                                                                                                                                                                                                                                                                  | `AppShell.tsx` hiện chỉ hiển thị placeholder "Stream/Reviews center is configured..." cho các tab này |
| Skill nội bộ cho Review Center                        | Đã được đội ngũ soạn sẵn state machine + pattern (`review-center-patterns/SKILL.md`) — **cần dùng làm nền tảng thiết kế**, không tự suy diễn lại                                                                                                                                                                                 | `.agents/skills/review-center-patterns/SKILL.md`                                                      |

**Kết luận quan trọng cho kế hoạch:** Phase 2 **không cần thiết kế lại schema từ đầu** (rủi ro R2 lớn nhất — về danh sách item type — đã được xác nhận ở Phase 1). Công việc Phase 2 chủ yếu là: (1) xây dựng **NestJS module `collaboration` và `review`** trên nền schema đã có, (2) xây dựng **React feature `collaboration` và `review`**, (3) bổ sung **`notification` module** làm nền tảng gửi email cho cả hai. Đây là tin tốt cho tiến độ, nhưng cũng là rủi ro nếu schema hiện tại có khoảng trống so với business rule (xem Mục 11 — Data Model Gap Analysis).

---

## 1. Executive Summary

Phase 2 đưa AL-JAMA từ một hệ thống "quản lý yêu cầu tĩnh" (Item + Traceability) thành một hệ thống có **cộng tác** (Stream/comment) và **quy trình review/phê duyệt số hoá đầu-cuối ở mức cơ bản** (khởi tạo review → reviewer/approver thao tác → hoàn tất). Đây là **critical path** của toàn bộ MVP vì Review Center chiếm ~55% khối lượng nghiệp vụ Must/Should (R1 trong Delivery Plan). Phase 2 cố tình **không** bao gồm phần điều phối nâng cao của Moderator (E7) hay baseline/báo cáo (E8) — các phần đó phụ thuộc vào E5/E6 chạy đúng trước, nên bị đẩy sang Phase 3.

Mục tiêu ra output của Phase 2: một người dùng có thể — (1) bình luận/@mention trên item, dự án; (2) Moderator khởi tạo review từ item có sẵn; (3) Reviewer đánh dấu đã xem, Approver approve/reject, cả hai bình luận theo đoạn; (4) hệ thống chặn hoàn tất khi còn reject (QT-06); (5) mọi thay đổi trạng thái được audit qua `review_item_status` theo revision.

---

## 2. Business Problem & Goals của Phase 2

**Vấn đề nghiệp vụ:** Sau Phase 1, người dùng có thể tạo/truy vết yêu cầu, nhưng **không có cách nào để trao đổi ngữ cảnh** (comment/mention) và **không có cách số hoá việc rà soát/phê duyệt nội dung** — vẫn phải làm thủ công qua email/họp, đúng nỗi đau mà BRD Mục 5 xác định là mục tiêu cốt lõi của sản phẩm.

**Mục tiêu kinh doanh đo lường được của Phase 2:**

- Loại bỏ việc trao đổi rời rạc qua email cho **thảo luận cấp item/dự án** → tập trung vào Stream.
- Số hoá được **một vòng đời review đơn giản** (không cần chữ ký điện tử thật — dời sang Phase 4/Q2) để demo giá trị cốt lõi sớm cho khách hàng, theo đúng khuyến nghị Mục 5.2 của Delivery Plan.
- Đảm bảo **toàn vẹn audit trail** của review (QT-04, QT-05) ngay từ đầu, vì đây là rủi ro khó sửa nếu để dồn sang Phase 3.

---

## 3. Actors & Roles (không đổi so với BRD, nhưng lần đầu được vận hành thực tế)

| Actor                      | Vai trò cố định                   | Vai trò phát sinh trong Phase 2                                                                                                                               |
| -------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator              | `project_role = ADMINISTRATOR`    | Không đổi                                                                                                                                                     |
| Project Member             | `project_role = MEMBER`           | Có thể được gán `review_role` (Moderator/Approver/Reviewer) **theo từng review**, độc lập với project_role                                                    |
| Moderator                  | —                                 | Vai trò **theo review**: khởi tạo, thêm participant, gửi email mời                                                                                            |
| Approver                   | —                                 | Vai trò **theo review**: Approve/Reject, có thể là signer (nhưng ký điện tử thật dời Phase 4)                                                                 |
| Reviewer                   | —                                 | Vai trò **theo review**: chỉ có checkbox "đã xem" (QT-04)                                                                                                     |
| Reviewer Limited (license) | `license_type = REVIEWER_LIMITED` | Lần đầu vai trò này **có nội dung thực sự để dùng** — chỉ truy cập được item qua Review Center (QT-08), cần ngữ cảnh upstream/downstream đính kèm (BR-REV-04) |

**Assumption A-P2-01:** Một Project Member bất kỳ đều có quyền "Start a Review" (BR-REV-01), vì Delivery Plan Mục 2 ghi nhận đây là điểm chưa có permission flag riêng trong DB. _Impact nếu sai:_ cần thêm 1 cột `can_initiate_review` vào `project_members` — không phá vỡ gì nếu bổ sung sau.

---

## 4. Scope Phase 2

### 4.1 In-scope — Bắt buộc (Must)

**E4 — Cộng tác:**

- BR-COLLAB-01 (Stream 3 cấp: item / project / organization)
- BR-COLLAB-02 (comment + @mention user/group/item)
- BR-COLLAB-05 (reply giữ mạch hội thoại)

**E5 — Review: Khởi tạo:**

- BR-REV-01 (chỉ luồng "a" — từ tab Reviews/item, **không làm luồng filter "rolling review"** — xem 4.3)
- BR-REV-05 (chọn template Approval/Peer — nhưng **không bắt buộc ký điện tử thật**, chỉ lưu placeholder)
- BR-REV-06 (thêm participant theo người/nhóm, gán review_role)
- BR-REV-07 (phân biệt rõ Reviewer/Approver)
- BR-REV-09 (Initiate → tạo revision 1 + gửi email)
- QT-07 (Approval template immutable, Peer editable)

**E6 — Review: Thực hiện:**

- BR-REV-10, 11 (mở review từ email, giao diện Review Center 3 vùng)
- BR-REV-12, 13 (comment tổng quát/theo đoạn, nhãn phân loại)
- BR-REV-14 (Reviewer checkbox "đã xem")
- BR-REV-15 (Approver Approve/Reject; **batch action dời sang Should**)
- BR-REV-18 (redline/greenline khi có version mới — **tái dùng `compareVersions` đã có ở E2**)
- BR-REV-20 (trang Complete Review + thống kê tối giản)
- BR-REV-21 (chặn hoàn tất khi còn reject — QT-06)
- BR-REV-24 (reset trạng thái khi publish revision mới — QT-05, QT-04)

### 4.2 In-scope — Nên có (Should, làm nếu còn dư lực)

- BR-COLLAB-03 (hashtag), BR-COLLAB-04 (request action), BR-COLLAB-06 (reply qua email), BR-COLLAB-07 (Connected Users mở rộng — đã có nền `item_activity_log` từ Phase 1)
- BR-REV-02, 03, 04 (rolling review từ filter, attachment, upstream/downstream context cho Reviewer Limited)
- BR-REV-08 (tuỳ biến email mời)
- BR-REV-16, 17, 19, 23 (mention trong review, preview attachment, filter "chỉ item cần review", widget review đang active ở Home)

### 4.3 Ngoài phạm vi Phase 2 (dời có chủ đích)

| Hạng mục                                                                                                                    | Lý do dời                                                                                                              | Dời tới                                |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Publish New Revision, Batch transition/edit, Close for Feedback, Archive/Recover, Finalize, Stats tab (BR-REV-25→37, QT-09) | Thuộc E7 — phụ thuộc E5/E6 chạy ổn định trước (không thể làm song song vì cùng ghi vào `reviews`/`review_item_status`) | Phase 3                                |
| Baseline auto-creation, Review Stats Report, Baseline Comparison (BR-REV-38→41)                                             | Thuộc E8 — phụ thuộc dữ liệu từ E7                                                                                     | Phase 3                                |
| Chữ ký điện tử thật (re-auth + signer meaning)                                                                              | Q2 đã xác nhận: làm ở **giai đoạn cuối MVP**, không phải Phase 2                                                       | Phase 4                                |
| Rolling review dựa trên filter phức tạp                                                                                     | Q6 chưa chốt độ phức tạp filter builder                                                                                | Có thể lùi vào Phase 3 nếu Q6 vẫn treo |
| Import Word/Excel vào review                                                                                                | Q4: dời sang giai đoạn cuối MVP                                                                                        | Phase 4                                |
| Test Management (E9)                                                                                                        | Q1 đã xác nhận: dời hẳn Post-MVP                                                                                       | Giai đoạn 2 của dự án (sau MVP)        |

---

## 5. Core Use Cases

### UC-1: Bình luận & @mention trên Item (E4)

```
Actor: Project Member (bất kỳ có quyền xem item)
Trigger: Người dùng muốn trao đổi về nội dung item
Preconditions: Item tồn tại, người dùng là thành viên project
Main Flow:
  1. Người dùng mở panel Stream/Comments của item (đã có nút trong ItemRightBar)
  2. Nhập nội dung, gõ "@" → hệ thống gợi ý user/group/item
  3. Gửi bình luận
  4. Hệ thống lưu comment (scope_type=ITEM, scope_id=itemId)
  5. Với mỗi mention → tạo comment_mentions + notification + (Should) email
Postcondition: Comment xuất hiện trong Stream của item, project, và (nếu áp dụng) organization
Business Rules: BR-COLLAB-01, 02
```

### UC-2: Moderator khởi tạo Review (E5)

```
Actor: Moderator (Project Member được chỉ định)
Trigger: Cần gửi một nhóm item đi rà soát/phê duyệt
Preconditions: Có ít nhất 1 item hợp lệ, có ít nhất 1 participant khả dụng
Main Flow:
  1. Chọn item(s) → "Start a Review"
  2. Chọn template (Approval/Peer) → nếu Approval, config bị khoá (QT-07)
  3. Thêm participant (user/group), gán review_role
  4. Đặt deadline
  5. Nhấn "Initiate"
  6. Hệ thống: reviews.status draft→active, tạo review_revisions #1,
     tạo review_item_status not_reviewed cho mọi (item × participant),
     gửi email mời
Postcondition: Review ở trạng thái active, mọi participant nhận được email
Business Rules: BR-REV-01,05,06,07,09; QT-07
Pre-condition đặc biệt: ≥1 participant, ≥1 item (theo state machine E7 draft→active)
```

### UC-3: Reviewer xem & đánh dấu đã xem (E6)

```
Actor: Reviewer
Trigger: Nhận email mời review
Main Flow:
  1. Bấm link email → mở Review Center
  2. Đọc item, có thể bôi chọn đoạn text để bình luận (selected_text)
  3. Đánh dấu checkbox "reviewed" cho item
Postcondition: review_item_status.status = REVIEWED cho (reviewItem, user, currentRevision)
Business Rules: BR-REV-10,11,12,13,14; QT-04
```

### UC-4: Approver Approve/Reject (E6)

```
Actor: Approver
Main Flow:
  1. Mở item trong Review Center
  2. Toggle Approve hoặc Reject
  3. (Nếu Reject) bắt buộc để lại comment giải thích — Assumption A-P2-02
Postcondition: review_item_status.status = APPROVED|REJECTED
Business Rules: BR-REV-15; QT-04
```

### UC-5: Hoàn tất Review (Complete Review) (E6)

```
Actor: Bất kỳ participant đã xử lý xong toàn bộ item được giao
Trigger: Participant đã reviewed/approved/rejected hết item của mình
Main Flow:
  1. Hệ thống hiển thị trang "Complete Review" với thống kê tối giản
     (số item đã xử lý, số comment đã tạo)
  2. Nếu còn ≥1 item REJECTED tại revision hiện tại (toàn review, không chỉ của participant này)
     → chỉ hiển thị "Cannot complete: N item(s) rejected"
  3. Ngược lại → participant.is_finished = true, finished_at = now()
Postcondition: Participant được đánh dấu hoàn tất cá nhân
Business Rules: BR-REV-20,21; QT-06
```

---

## 6. Functional Requirements — Bảng truy vết (trích, đầy đủ trong WBS Mục 22)

| FR ID        | Mô tả                                                                                                                            | BR nguồn         | Ưu tiên |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------- |
| FR-COLLAB-01 | Tạo comment gắn với item/project (scope polymorphic)                                                                             | BR-COLLAB-01     | Must    |
| FR-COLLAB-02 | @mention user/group/item trong comment, tạo `comment_mentions`                                                                   | BR-COLLAB-02     | Must    |
| FR-COLLAB-03 | Reply giữ `parent_comment_id`                                                                                                    | BR-COLLAB-05     | Must    |
| FR-REV-01    | API tạo Review từ danh sách item đã chọn                                                                                         | BR-REV-01        | Must    |
| FR-REV-02    | Cấu hình Review Template (Approval immutable / Peer editable)                                                                    | BR-REV-05, QT-07 | Must    |
| FR-REV-03    | Thêm participant theo user hoặc group, gán review_role                                                                           | BR-REV-06        | Must    |
| FR-REV-04    | Initiate: chuyển draft→active, tạo revision #1, snapshot item version tại thời điểm gửi (`review_items.item_version_at_send_id`) | BR-REV-09        | Must    |
| FR-REV-05    | Review Center 3 vùng: Summary/TOC/Search, Toolbar, Item list                                                                     | BR-REV-11        | Must    |
| FR-REV-06    | Comment theo item hoặc theo đoạn text chọn (`selected_text`), gắn nhãn (general/question/proposed_change/issue)                  | BR-REV-12,13     | Must    |
| FR-REV-07    | Reviewer set trạng thái `REVIEWED` (không có approve/reject)                                                                     | BR-REV-14, QT-04 | Must    |
| FR-REV-08    | Approver set `APPROVED`/`REJECTED`                                                                                               | BR-REV-15, QT-04 | Must    |
| FR-REV-09    | Complete Review: chặn nếu còn REJECTED tại current_revision_number                                                               | BR-REV-21, QT-06 | Must    |
| FR-REV-10    | Redline/Greenline khi item có version mới trong lúc đang review                                                                  | BR-REV-18        | Must    |
| FR-REV-11    | Email thông báo: mời tham gia, @mention trong review                                                                             | BR-REV-08,09,16  | Should  |
| FR-REV-12    | Include upstream/downstream item làm ngữ cảnh (đặc biệt cho Reviewer Limited)                                                    | BR-REV-04, QT-08 | Should  |

---

## 7. Business Rules áp dụng trong Phase 2

| Mã    | Nội dung                                                                               | Điểm cần lưu ý khi implement                                                                                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QT-04 | Reviewer chỉ có "đã xem"; Approver có Approve/Reject — **không dùng chung enum tuỳ ý** | `review_item_status.status` dùng chung enum `NOT_REVIEWED/REVIEWED/APPROVED/REJECTED`, nhưng **validation ở tầng service** phải chặn Reviewer set APPROVED/REJECTED và chặn Approver set REVIEWED (không phải DB constraint) |
| QT-05 | Publish revision mới → **không xoá** trạng thái cũ, chỉ tăng `revision_number`         | Không áp dụng trực tiếp trong Phase 2 vì Publish Revision thuộc E7, nhưng **schema và query pattern phải được thiết kế đúng ngay từ E6** để E7 không phải sửa lại (đã có trong `review-center-patterns/SKILL.md` Mục 2)      |
| QT-06 | Không cho hoàn tất/ký khi còn reject                                                   | Kiểm tra ở tầng service trước khi set `is_finished = true` hoặc cho phép finalize (finalize thuộc E7, nhưng **complete cá nhân** thuộc E6)                                                                                   |
| QT-07 | Approval template immutable khi tạo review; Peer template editable                     | `review_templates.is_editable_on_create` — validate ở DTO tầng tạo review                                                                                                                                                    |
| QT-08 | Reviewer Limited không có quyền Explorer/List View, chỉ xem qua Review Center          | Đã có `LicenseGuard` từ Phase 1 (`RequireLicense(LicenseType.FULL)`) — **tái sử dụng**, review endpoints phải **không** áp dụng guard này cho GET review detail                                                              |

---

## 8. Workflows / State Machines

### 8.1 Review status (`reviews.status`) — chỉ phần Phase 2 chạm tới

```
draft ──[Initiate: ≥1 participant, ≥1 item]──▶ active
```

Phase 2 **chỉ** implement transition `draft → active`. Transition `active → closed_for_feedback → ...` thuộc E7, nhưng **guard function `canTransition()` nên được viết đầy đủ ngay từ đầu** (theo `review-center-patterns/SKILL.md` Mục 1) để tránh nợ kỹ thuật khi E7 bắt đầu — chỉ chưa cần expose API cho các transition còn lại.

### 8.2 Review Item Status theo participant, theo revision

```
Reviewer:  not_reviewed ──▶ reviewed
Approver:  not_reviewed ──▶ approved
                        ╲─▶ rejected
```

Phase 2 chỉ có **revision_number = 1** (vì Publish New Revision thuộc E7). Query pattern (`WHERE revisionNumber = review.currentRevisionNumber`) phải được dùng ngay từ đầu dù giá trị luôn = 1, để tương thích ngược khi E7 thêm revision #2 trở đi.

### 8.3 Comment resolution flow (Stream, E4 — không phải review comment)

```
created ──[reply]──▶ (thread mở rộng)
created ──[gắn action_text]──▶ pending action ──[resolve]──▶ resolved
```

---

## 9. Permission Model — Delta so với Phase 1

| Hành động                                         |   Moderator (review đó)    | Approver (review đó) | Reviewer (review đó) |                Reviewer Limited                 |
| ------------------------------------------------- | :------------------------: | :------------------: | :------------------: | :---------------------------------------------: |
| Tạo comment/reply trên item (Stream ngoài review) | ✅ (nếu là Project Member) |          ✅          |          ✅          |                   ❌ (QT-08)                    |
| Khởi tạo review                                   |  ✅ (nếu Project Member)   |          —           |          —           |                       ❌                        |
| Thêm participant lúc khởi tạo                     |             ✅             |          —           |          —           |                        —                        |
| Comment trong Review Center                       |             ✅             |          ✅          |          ✅          |     ✅ (chỉ trong phạm vi review được mời)      |
| Mark reviewed                                     |             —              |          —           |          ✅          |             ✅ (nếu role=reviewer)              |
| Approve/Reject                                    |             —              |          ✅          |          ❌          |             ✅ (nếu role=approver)              |
| Xem upstream/downstream context trong review      |             ✅             |          ✅          |          ✅          | ✅ **chỉ khi** `reviews.include_context = true` |

**Lưu ý triển khai:** cần một guard mới `ReviewParticipantGuard` (khác `ProjectRoleGuard` đã có) vì `review_role` không nằm trong `project_members` — phải join qua `review_participants` theo `(reviewId, userId)`.

---

## 10. Domain Model — không tạo bảng mới, chỉ làm rõ quan hệ sẽ được dùng

```
Review ──< ReviewItem >── Item (đã tồn tại từ E2)
Review ──< ReviewParticipant >── User
ReviewItem ──< ReviewItemStatus >── ReviewParticipant (theo revisionNumber)
ReviewItem ──< ReviewComment >── (self-reference: parentCommentId)
Review ──< ReviewRevision  (Phase 2 chỉ có 1 dòng, revisionNumber=1)
Comment (Stream, KHÔNG PHẢI ReviewComment) ──polymorphic── Item | Project
```

**Điểm khác biệt quan trọng cần agent lưu ý khi code:** `comments` (Stream, E4) và `review_comments` (trong Review Center, E6) là **hai bảng hoàn toàn khác nhau** theo đúng Module Boundary Rules (`collaboration` module sở hữu `comments`, `review` module sở hữu `review_comments`). Không được dùng chung service.

---

## 11. Data Model Gap Analysis

Đối chiếu schema hiện có với yêu cầu Phase 2, phát hiện các điểm cần xác nhận **trước khi code** (tránh sửa migration giữa chừng — vi phạm `.agents/rules/migration-seed-policy.md`):

| #   | Vấn đề                                                                               | Hiện trạng schema                                    | Đề xuất                                                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | `review_participants` không có cột phân biệt "được thêm theo cá nhân hay theo group" | Chỉ có `userId` (không nullable), không có `groupId` | **Gap thật sự** so với Database_Schema doc gốc (vốn có `group_id` nullable). Cần 1 migration nhỏ thêm `group_id UUID NULL` + logic "expand group thành participant cá nhân lúc Initiate" — quyết định kiến trúc: **expand tại thời điểm Initiate** (đơn giản hơn) thay vì tính động, vì query review-progress sẽ đơn giản hơn nhiều |
| G2  | `reviews` không có cột lưu ai là **signer** mặc định nếu Approval template           | `review_participants.is_signer` đã có                | Không cần thay đổi — is_signer set thủ công khi thêm participant, đủ cho Phase 2 (chưa cần ký thật)                                                                                                                                                                                                                                 |
| G3  | Không có bảng lưu "item nào là context-only" khi include upstream/downstream         | `review_items.is_context_only` **đã có sẵn**         | Không cần thay đổi — dùng đúng field này cho BR-REV-04                                                                                                                                                                                                                                                                              |
| G4  | `review_comments.selected_text` không lưu vị trí (offset) trong nội dung item        | Chỉ lưu text, không lưu range                        | **Assumption A-P2-03**: chấp nhận highlight theo text-match đơn giản (không cần offset chính xác) cho Phase 2 — nếu về sau cần highlight chính xác trên rich text đã sửa, cần bổ sung offset. Rủi ro thấp vì tính năng phụ.                                                                                                         |
| G5  | Không có trường lưu lý do reject bắt buộc                                            | `review_item_status` chỉ có enum status              | **Assumption A-P2-02**: lý do reject được lưu dưới dạng 1 `review_comment` bắt buộc đi kèm hành động reject (validate ở service: nếu status=REJECTED thì phải có ít nhất 1 review_comment cùng revisionNumber từ đúng participant đó) — không thêm cột riêng, tận dụng bảng đã có                                                   |

**Quyết định migration:** Phase 2 cần **1 migration duy nhất** (thêm `group_id` cho `review_participants`), phải làm ở đầu Phase 2 trước khi code service, theo đúng Checklist Mục 5 của `migration-seed-policy.md`.

---

## 12. System Boundaries / Module Ownership (bổ sung vào bảng AGENTS.md)

| Module mới                          | Bảng sở hữu                                                                                                                                                    | Phụ thuộc (import service)                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `collaboration`                     | comments, comment_mentions, comment_hashtags, comment_actions                                                                                                  | `user` (mention), `item` (validate scope tồn tại), `notification` (emit event)                                                            |
| `review`                            | review_templates, reviews, review_items, review_participants, review_item_status, review_comments, review_comment_mentions, review_revisions (chỉ tạo dòng #1) | `item` (lấy item + version snapshot), `project` (participant từ project_members/user_groups), `notification`                              |
| `notification` (mới, cross-cutting) | notifications                                                                                                                                                  | Không phụ thuộc module nghiệp vụ nào — chỉ lắng nghe event qua `EventEmitter2`, giống pattern `TraceabilityEventListener` đã có ở Phase 1 |

**Quyết định kiến trúc (kế thừa pattern đã dùng ở Phase 1):** `review` module **không gọi trực tiếp** `NotificationService.send()`; thay vào đó emit event (`review.initiated`, `review.item.commented`, ...) và `NotificationEventListener` xử lý — đúng theo `nestjs-module-scaffold/SKILL.md` Rule 4 ("Emit events cho side-effects").

---

## 13. Kiến trúc cho Phase 2

Giữ nguyên quyết định kiến trúc đã chốt ở Phase 1: **Modular Monolith**. Phase 2 không cần thay đổi quyết định này — vẫn chưa có driver nghiệp vụ nào đòi hỏi tách service riêng.

**Vấn đề mới của Phase 2:** Email gửi thật (SMTP) có thể chậm/lỗi, không được block transaction chính (ví dụ: Initiate Review không được chờ email gửi xong mới trả response).
**Quyết định:** Dùng `@nestjs/bullmq` (đã có sẵn trong `package.json` nhưng chưa dùng ở Phase 1) làm queue cho notification — nghĩa là `notification` module Phase 2 là module **đầu tiên thực sự dùng BullMQ đã cài từ trước**.
**Phương án đơn giản hơn đã cân nhắc:** gọi SMTP đồng bộ trong event listener (như style `TraceabilityEventListener` hiện tại) — bị loại vì email thật có độ trễ mạng không kiểm soát được, khác với suspect-flag (chỉ ghi DB nội bộ).
**Đánh đổi:** thêm 1 phụ thuộc vận hành (Redis đã có sẵn từ docker-compose, không phát sinh hạ tầng mới) đổi lấy việc Initiate Review/Comment không bị treo khi SMTP chậm.

---

## 14. Major System Flows

### 14.1 Initiate Review

```
Moderator (FE)
   ↓ POST /projects/:id/reviews
Review Controller
   ↓ validate: ≥1 item, ≥1 participant, template hợp lệ (QT-07)
Review Service (transaction)
   ↓ create Review(draft) → items → participants
   ↓ (nếu group participant) expand group → participants cá nhân (G1)
   ↓ Initiate: status→active, tạo ReviewRevision #1
   ↓ snapshot item_version_at_send_id cho từng review_item
   ↓ tạo review_item_status NOT_REVIEWED cho (item × participant)
   ↓ emit 'review.initiated'
Database (commit)
   ↓ (async, ngoài transaction)
Notification Listener → BullMQ queue → Email job → SMTP
```

### 14.2 Approver Reject Item

```
Approver (FE)
   ↓ PATCH /reviews/:id/items/:itemId/status {status: REJECTED, comment: "..."}
Review Service
   ↓ validate: user.review_role === APPROVER cho review này (ReviewParticipantGuard)
   ↓ validate: comment không rỗng (Assumption A-P2-02)
   ↓ transaction: create review_comment (label=issue/general) + update review_item_status
   ↓ emit 'review.item.rejected'
```

### 14.3 Complete Review (cá nhân)

```
Participant (FE)
   ↓ POST /reviews/:id/complete
Review Service
   ↓ query: COUNT review_item_status WHERE reviewId, revisionNumber=current, status=REJECTED
   ↓ if count > 0 → 409 "Cannot complete: N item(s) rejected — request new revision"  (QT-06)
   ↓ else → update review_participants.is_finished=true, finished_at=now()
```

---

## 15. External Integrations

| Hệ thống                                                      | Mục đích                       | Chiều    | Ghi chú Phase 2                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SMTP (đã cấu hình biến môi trường từ Phase 1: `SMTP_HOST`...) | Gửi email mời review, @mention | Outbound | **Q7 vẫn chưa chốt** (SMTP thật hay chỉ log) — Phase 2 implement theo giả định "SMTP thật + log song song" đã nêu ở Delivery Plan, nhưng code phải có fallback: nếu `SMTP_USER` rỗng → chỉ log ra console, không throw lỗi (để không chặn demo môi trường chưa có SMTP) |

---

## 16. Non-Functional Requirements bổ sung cho Phase 2

- **Độ trễ Comment:** tạo comment phải phản hồi ngay (không chờ xử lý mention/email) — email là async qua queue (Mục 13).
- **Toàn vẹn dữ liệu:** thao tác Initiate Review phải là 1 transaction DB duy nhất (giống pattern `createItem`/`updateItem` ở Phase 1) — không được để trường hợp review ở trạng thái active nhưng thiếu `review_item_status`.
- Chưa có số liệu cụ thể về số lượng comment/review đồng thời — giữ nguyên nguyên tắc Phase 1: không tự đặt SLA khi chưa có input khách hàng.

---

## 17. Security & Audit

- Mọi hành động **Approve/Reject/Complete Review** phải ghi vào `audit_logs` (entity_type='review_item_status', action='APPROVE'/'REJECT'/'COMPLETE') — vì đây là hành động có giá trị phê duyệt, thuộc nhóm ưu tiên kiểm toán theo BRD Chương 7/23.
- `ReviewParticipantGuard` phải chặn truy cập review mà user không phải participant, **kể cả Administrator** (trừ khi Administrator cũng được thêm làm Moderator) — khác với Explorer nơi Administrator luôn thấy hết. Đây là điểm khác biệt permission cần lưu ý khi code guard (không tái dùng y nguyên logic `LicenseGuard`).

---

## 18. Notification Requirements

| Sự kiện                                     | Người nhận          | Kênh                                            | Nội dung tối thiểu                   |
| ------------------------------------------- | ------------------- | ----------------------------------------------- | ------------------------------------ |
| Comment @mention (Stream)                   | User được mention   | In-app (`notifications` table) + Email (Should) | Link tới item, tên người mention     |
| Review Initiated                            | Toàn bộ participant | Email (Must — BR-REV-09)                        | Vai trò, deadline, link review       |
| Reject trên item mình phụ trách (Moderator) | Moderator           | In-app                                          | Item nào bị reject, ai reject        |
| @mention trong review comment               | User được mention   | Email (Should — BR-REV-16)                      | Link trực tiếp tới item trong review |

---

## 19. Edge Cases cần xử lý trong Phase 2

- Moderator xoá 1 item khỏi project **sau khi** đã đưa vào review đang active → item vẫn hiển thị trong Review Center với dữ liệu snapshot (`item_version_at_send_id`), không được lỗi 404.
- 2 participant cùng thuộc 1 group được thêm 2 lần (1 lần cá nhân, 1 lần qua group) → unique constraint `(review_id, user_id)` trên `review_participants` đã tồn tại, cần xử lý **merge, không lỗi 500**, khi expand group (G1).
- User bị đổi `license_type` thành `REVIEWER_LIMITED` **sau khi** đã được thêm vào review với ngữ cảnh đầy đủ → vẫn giữ quyền xem trong review đó (đã invited), chỉ áp dụng hạn chế cho truy cập project ngoài review.
- Approver Reject nhưng sau đó item đã được Moderator sửa (trong phạm vi ngoài scope Phase 2 — Moderator sửa item thuộc E7) → **out of scope**, nhưng service Phase 2 phải đảm bảo query trạng thái REJECTED không tự động biến mất nếu không qua đúng luồng E7.
- Deadline review đã qua nhưng review vẫn `active` → Phase 2 **không tự động** chuyển trạng thái (không có cron job) — chỉ hiển thị cảnh báo UI "Overdue". Tự động hoá dời sang Phase 3 nếu cần.

---

## 20. Risks & Assumptions (bổ sung so với Delivery Plan)

| #     | Risk/Assumption                                                                                                       | Loại       | Tác động   | Giảm thiểu                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------- |
| RP2-1 | G1 (group participant) là gap thật giữa Database_Schema doc và Prisma schema đã migrate                               | Kỹ thuật   | Trung bình | Cần 1 migration nhỏ đầu Phase 2, không đụng dữ liệu hiện có (chỉ ADD COLUMN nullable) |
| RP2-2 | Q7 (SMTP thật hay log) vẫn treo — nếu khách hàng muốn log-only, code hiện tại (fallback nêu ở Mục 15) vẫn tương thích | Nghiệp vụ  | Thấp       | Đã thiết kế fallback ngay từ đầu                                                      |
| RP2-3 | Review Center là module lớn nhất (R1 Delivery Plan) — nếu để 1 PR khổng lồ sẽ khó review code                         | Lịch trình | Cao        | Tách theo Epic con trong WBS Mục 22 thành nhiều PR nhỏ theo `docs/GIT_FLOW.md`        |
| RP2-4 | Assumption A-P2-02 (bắt buộc comment khi reject) chưa được BRD xác nhận rõ                                            | Nghiệp vụ  | Thấp       | Nêu rõ trong UAT để khách hàng xác nhận hoặc bác bỏ sớm                               |

---

## 21. MVP Definition cho Phase 2 (nếu cần rút gọn thêm)

Nếu áp lực thời gian buộc phải cắt giảm trong nội bộ Phase 2, thứ tự ưu tiên cắt giảm (từ dễ cắt nhất):

1. BR-COLLAB-06/07, BR-REV-16/17/19/23 (toàn bộ nhóm Should) → cắt đầu tiên.
2. BR-REV-02/03/04 (rolling review từ filter, attachment, context) → cắt thứ hai, giữ lại luồng "Start Review" thủ công từ item.
3. **Không được cắt**: QT-04, QT-05 (thiết kế), QT-06, QT-07 — đây là các quy tắc lõi giữ tính đúng đắn nghiệp vụ, cắt sẽ tạo nợ kỹ thuật cho Phase 3.

---

## 22. WBS / Epics / Features / Tasks

### 22.1 Epic E4 — Cộng tác (Collaboration)

**Nhánh:** `feature/E4-collaboration-stream`

- Feature E4.1: NestJS `collaboration` module (controller/service/DTO) cho CRUD comment theo scope (item/project)
- Feature E4.2: Parse @mention trong content → tạo `comment_mentions`, emit event
- Feature E4.3: Reply thread (parent_comment_id)
- Feature E4.4: React feature `collaboration` — Stream panel component, tái dùng vị trí đã có sẵn nút "Comments" trong `item-right-bar.tsx` (hiện đang là placeholder trống)
- Feature E4.5 (Should): Hashtag, Action/Resolve

### 22.2 Epic E5 — Review: Khởi tạo

**Nhánh:** `feature/E5-review-initiation`

- Feature E5.0: Migration bổ sung `group_id` cho `review_participants` (G1) — **làm trước tiên**
- Feature E5.1: `review` module scaffold + `ReviewTemplate` CRUD (Admin cấu hình Approval/Peer)
- Feature E5.2: API tạo Review (draft) từ danh sách item
- Feature E5.3: API thêm participant (user/group) + expand group logic
- Feature E5.4: API Initiate (draft→active, tạo revision #1, snapshot version, tạo review_item_status)
- Feature E5.5: React: wizard "Start a Review" (chọn item → template → participant → deadline → Initiate)
- Feature E5.6 (Should): Rolling review từ filter, attachment, upstream/downstream context toggle

### 22.3 Epic E6 — Review: Thực hiện

**Nhánh:** `feature/E6-review-execution`

- Feature E6.1: `ReviewParticipantGuard`
- Feature E6.2: API set trạng thái item (reviewed/approved/rejected) + validate QT-04
- Feature E6.3: API review_comments (theo item hoặc selected_text) + nhãn phân loại
- Feature E6.4: API Complete Review + validate QT-06
- Feature E6.5: React: Review Center layout 3 vùng (Summary/TOC/Search — Toolbar — Item list)
- Feature E6.6: React: redline/greenline khi version mới (tái dùng `VersionDiffCanvas` đã có từ E2)
- Feature E6.7 (Should): Batch mark approved/rejected cả trang; filter "chỉ item cần review"

### 22.4 Cross-cutting — Notification (song song, bắt đầu cùng E5)

**Nhánh:** `chore/notification-module-bullmq`

- `notification` module: nghe event từ `collaboration` + `review`, đẩy vào BullMQ, xử lý gửi email + ghi `notifications` table
- Audit log cho hành động Approve/Reject/Complete

---

## 23. Acceptance Criteria (Given/When/Then) — bổ sung cho Phase 2

```
AC-06 (BR-COLLAB-02 — @mention)
Given người dùng A đang soạn comment trên item X
When A gõ "@" và chọn user B
Then hệ thống lưu comment_mentions liên kết comment với B
And B nhận được 1 notification trong bảng notifications

AC-07 (QT-04 — Reviewer không có Approve/Reject)
Given user U có review_role = REVIEWER trong review R
When U gọi API set status = APPROVED cho 1 item trong R
Then hệ thống trả về lỗi 403 Forbidden

AC-08 (QT-06 — chặn Complete khi còn reject, áp dụng ở mức cá nhân Phase 2)
Given review R có ít nhất 1 item ở trạng thái REJECTED tại revision hiện tại
When bất kỳ participant nào gọi API Complete Review
Then hệ thống trả về lỗi và liệt kê số lượng item đang reject
And participant.is_finished KHÔNG được set true

AC-09 (G1 — Group participant expand)
Given Moderator thêm 1 user_group gồm 3 thành viên vào review lúc Initiate
When Initiate được gọi
Then hệ thống tạo 3 dòng review_participants riêng biệt (không lưu group_id ở review_item_status)
And nếu 1 trong 3 thành viên đã được thêm cá nhân trước đó, không tạo trùng participant (unique constraint)
```

---

## 24. Dependencies & Sequencing

```
Phase 1 (đã xong)
   ↓
E5.0 (migration group_id) ─── PHẢI làm trước mọi API E5 khác
   ↓
E5.1 → E5.2 → E5.3 → E5.4  (tuần tự, mỗi bước phụ thuộc bước trước)
   ↓
E6.1 → E6.2/E6.3 (song song được) → E6.4
   ↓
E6.5, E6.6 (FE, có thể làm song song với E6.2-E6.4 nếu có 2 dev)

E4 (Collaboration) ─── ĐỘC LẬP với E5/E6, có thể chạy song song hoàn toàn
Notification module ─── bắt đầu cùng lúc E5.4 (điểm đầu tiên cần emit email thật)
```

**Khuyến nghị phân công nếu có ≥2 dev:** 1 dev làm E4 (độc lập, đơn giản hơn) trong khi dev còn lại làm E5→E6 (chuỗi phụ thuộc dài, rủi ro cao hơn — đúng theo R1 trong Delivery Plan).

---

## 25. Open Questions cần xác nhận trước/trong Phase 2

| #    | Câu hỏi                                                                                                                                            | Ảnh hưởng nếu không trả lời                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| OQ-1 | Q7 (SMTP thật hay log-only) — kế thừa từ BRD Ch.10, vẫn chưa chốt                                                                                  | Không chặn code (đã có fallback Mục 15), nhưng ảnh hưởng UAT                         |
| OQ-2 | Q3 (permission model đơn giản hoá) — vẫn chưa chốt                                                                                                 | Ảnh hưởng có cần thêm `can_initiate_review` flag hay không (Assumption A-P2-01)      |
| OQ-3 | Approver Reject có bắt buộc kèm comment không? (Assumption A-P2-02)                                                                                | Nếu khách hàng nói "không bắt buộc", chỉ cần bỏ 1 validation, không ảnh hưởng schema |
| OQ-4 | "Batch action mark toàn trang approved/rejected" (BR-REV-15) — mức độ ưu tiên thực tế có phải Must không, vì BRD ghi chú rủi ro "rubber-stamping"? | Ảnh hưởng độ ưu tiên trong Mục 4.2                                                   |

---

## 26. Architecture Decision Records (ADR) cho Phase 2

**ADR-P2-01: Expand group participant tại thời điểm Initiate (không tính động)**

```
Vấn đề: review_participants cần hỗ trợ thêm theo group nhưng schema hiện tại chỉ có user_id.
Lý do: Nếu tính động (join qua user_group_members mỗi lần query), mọi query "participant progress"
       (thuộc E7 sau này) sẽ phức tạp hơn nhiều và không ổn định nếu group đổi thành viên giữa chừng review.
Phương án đơn giản hơn đã cân nhắc: giữ group_id động, query runtime — bị loại vì phá vỡ audit trail
       (ai thực sự được mời tại thời điểm đó phải cố định).
Đánh đổi: cần 1 bước "expand" tại Initiate, nhưng đổi lại toàn bộ logic E6/E7 phía sau đơn giản
       và đúng với nguyên tắc A5 (audit) đã có trong Database Schema doc.
```

**ADR-P2-02: Dùng BullMQ (đã cài, chưa dùng) cho notification thay vì gọi email đồng bộ**

```
Vấn đề: Initiate Review / comment mention cần gửi email nhưng không được block response.
Lý do: SMTP có độ trễ/lỗi mạng không kiểm soát được, khác hẳn ghi DB nội bộ (như suspect-flag ở Phase 1).
Phương án đơn giản hơn đã cân nhắc: giữ pattern EventEmitter2 đồng bộ như TraceabilityEventListener
       — chấp nhận được cho ghi DB, nhưng rủi ro cho SMTP vì có thể làm chậm cả transaction gốc nếu
       vô tình được gọi trong cùng request cycle.
Đánh đổi: thêm 1 lớp queue (Redis đã có sẵn từ docker-compose Phase 1, không phát sinh hạ tầng mới),
       đổi lấy độ ổn định cho toàn bộ luồng review/comment.
```
