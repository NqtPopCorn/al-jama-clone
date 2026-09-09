# MVP DELIVERY PLAN — JAMA-CLONE

**Nguồn căn cứ:** `BRD_He_thong_Quan_ly_Yeu_cau_MVP.md` (v1.0) và `Database_Schema_JAMA_Clone_MVP.md`
**Vai trò tài liệu:** Đưa BRD + Data Model đã có thành một **kế hoạch triển khai MVP** khả thi — có scope chốt tạm thời, permission matrix, state machine, WBS/Epic, phân kỳ (phasing), rủi ro và acceptance criteria — để đội dự án có thể bắt đầu thiết kế UI/UX và implement.
**Ngày lập:** 09/09/2026 — Draft v1.0

> Tài liệu này **không tạo thêm business rule mới** ngoài những gì đã có trong BRD/DB Schema. Với 8 câu hỏi mở ở BRD Chương 10 chưa được khách hàng trả lời, tài liệu đưa ra **quyết định tạm thời (provisional decision)** để không chặn tiến độ, kèm rủi ro nếu quyết định đó sai — xem Mục 1 và Mục 9.

---

## 0. Tóm tắt điều hành

- Phạm vi nghiệp vụ đã được xác định rõ qua BRD (41 yêu cầu BR + 9 quy tắc QT) và đã có Data Model logic tương ứng.
- Rủi ro lớn nhất **không phải kỹ thuật** mà là **8 câu hỏi mở chưa chốt** — đặc biệt Q1 (Test Management), Q3 (license/permission), Q5 (danh sách item type) ảnh hưởng trực tiếp đến khối lượng công việc và schema.
- Module **Review Center** (6.6) chiếm ~55% tổng số yêu cầu Must/Should (BR-REV-01 → BR-REV-41) → đây là **critical path** của MVP, không phải Test Management.
- Khuyến nghị kiến trúc: **Modular Monolith** — không cần microservices ở giai đoạn MVP (xem Mục 8).
- Đề xuất chia MVP thành **4 phase** theo phụ thuộc nghiệp vụ (Mục 5), có thể cắt Phase 4 (Test Management) nếu cần rút ngắn thời gian — đúng như BRD Chương 10 Câu hỏi #1 đã gợi ý.

---

## 1. Phạm vi MVP — Cập nhật theo xác nhận chính thức từ khách hàng (09/09/2026)

Khách hàng đã xác nhận **5/8 câu hỏi mở**. Còn **Q3, Q6, Q7 chưa có xác nhận** — tiếp tục dùng giả định tạm thời như bản trước (giữ nguyên rủi ro nếu sai).

| #   | Câu hỏi (BRD Ch.10)                                 | Trạng thái                    | Nội dung xác nhận / giả định                                                                                            | Tác động tới kế hoạch                                                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Test Management vào MVP giai đoạn 1?                | ✅ **Đã xác nhận**            | **Không** — chưa cần ở giai đoạn sớm; ưu tiên nguồn lực cho luồng Item – Traceability – Review trước.                   | E9 (Test Management) chuyển hẳn thành **Post-MVP / Giai đoạn 2 của dự án**, không còn nằm trong 4 phase MVP — xem Mục 4, 5 đã cập nhật.                                                                                                                                                                                 |
| Q2  | Chữ ký điện tử: chỉ UI/UX hay giá trị pháp lý thật? | ✅ **Đã xác nhận** (một phần) | **Implement đơn giản** (mô phỏng UI/UX) — thực hiện ở **giai đoạn cuối của MVP**, không phải ngay từ Phase 2.           | Approval Review template (BR-REV-05, bắt buộc chữ ký) **chưa thể hoàn tất luồng ký thật cho tới Phase cuối** → phát sinh rủi ro mới R8 (Mục 6). Câu hỏi giá trị pháp lý 21 CFR Part 11 client chưa trả lời trực tiếp, nhưng "đơn giản" được hiểu là không cam kết giá trị pháp lý — cần ghi rõ trong tài liệu bàn giao. |
| Q3  | Phân quyền license đầy đủ hay đơn giản hoá?         | ⏳ **Chưa xác nhận**          | Giữ giả định cũ: 2 license (`full`, `reviewer_limited`), 2 project_role, review_role tách riêng theo từng review.       | Không đổi so với bản trước — vẫn nên xác nhận sớm vì ảnh hưởng trực tiếp Permission Matrix (Mục 2).                                                                                                                                                                                                                     |
| Q4  | Import Word/Excel bắt buộc MVP không?               | ✅ **Đã xác nhận**            | **Có trong MVP**, nhưng thực hiện ở **giai đoạn cuối của MVP** — đầu MVP chỉ nhập tay + reuse item có sẵn.              | BR-ITEM-03 (phần import) chuyển từ "đẩy sang Post-MVP" (bản trước) sang **"trong MVP, ở phase cuối"** — xem Mục 5 Phase 4.                                                                                                                                                                                              |
| Q5  | Danh sách item type cụ thể?                         | ✅ **Đã xác nhận**            | **3 loại**: Requirement, Use Case, Test Case — mỗi loại field tối thiểu. **Không có Defect, Epic** ở giai đoạn MVP này. | Seed `item_types`/`item_type_fields` chỉ 3 loại. Defect item type dời cùng Test Management (Q1) — kéo theo BR-TEST-05/06 (Defect, Coverage Explorer truy vết lên epic/requirement) cũng dời theo, xem ghi chú Mục 4.                                                                                                    |
| Q6  | Độ phức tạp filter cho rolling review?              | ⏳ **Chưa xác nhận**          | Giữ giả định cũ: dùng filter/trạng thái dựng sẵn, không xây filter builder tuỳ biến.                                    | Không đổi — ảnh hưởng thấp, có thể xác nhận muộn hơn trong Phase 2.                                                                                                                                                                                                                                                     |
| Q7  | Email thật (SMTP) hay mô phỏng/log?                 | ⏳ **Chưa xác nhận**          | Giữ giả định cũ: SMTP thật + log song song để debug/demo.                                                               | Không đổi — ảnh hưởng thấp, có thể xác nhận muộn hơn trong Phase 2.                                                                                                                                                                                                                                                     |
| Q8  | Multi-tenant ngay từ MVP?                           | ✅ **Đã xác nhận**            | **Không** — single-tenant per deployment, đúng theo giả định A1 (Database Schema).                                      | Không cần thay đổi thiết kế DB hiện tại — an toàn, tránh được rủi ro tốn công refactor `organization_id` về sau.                                                                                                                                                                                                        |

> **Còn lại cần xác nhận: Q3 (ưu tiên — ảnh hưởng permission matrix), Q6, Q7 (ưu tiên thấp hơn, có thể xác nhận trong lúc chạy Phase 2).**

---

## 2. Permission Model (Ma trận quyền)

BRD mô tả vai trò theo lời văn (Chương 3.2); ma trận dưới đây tường minh hoá theo hành động cụ thể để tránh mơ hồ khi phân quyền (BE middleware / FE hiển thị nút).

**Lưu ý về scope quyền:** `Administrator`/`Project Member` là vai trò **cố định theo project** (`project_members.project_role`). `Moderator`/`Approver`/`Reviewer` là vai trò **theo từng review** (`review_participants.review_role`) — một người có thể là Project Member ở project nhưng là Approver ở review A và Reviewer ở review B.

| Hành động                                                             | Administrator |     Project Member      | Moderator (của review đó) | Approver (của review đó) | Reviewer (của review đó) |    Reviewer license hạn chế    |
| --------------------------------------------------------------------- | :-----------: | :---------------------: | :-----------------------: | :----------------------: | :----------------------: | :----------------------------: |
| Cấu hình item type / relationship type / template review              |      ✅       |           ❌            |            ❌             |            ❌            |            ❌            |               ❌               |
| Tạo / sửa / xoá Item                                                  |      ✅       |           ✅            |             —             |            —             |            —             |               ❌               |
| Xem toàn bộ project qua Explorer/List View (read-only)                |      ✅       |           ✅            |            ✅*            |           ✅*            |           ✅*            | ❌ (chỉ xem qua Review Center) |
| Tạo relationship / clear suspect flag                                 |      ✅       |           ✅            |             —             |            —             |            —             |               ❌               |
| Khởi tạo Review (Start a Review)                                      |      ✅       | ✅ (nếu được cấp quyền) |             —             |            —             |            —             |               ❌               |
| Thêm/bớt participant, publish revision, close/archive/finalize review |      ✅       |            —            |            ✅             |            ❌            |            ❌            |               ❌               |
| Bình luận trong Review, đánh dấu "đã xem"                             |       —       |            —            |            ✅             |            ✅            |            ✅            | ✅ (chỉ trong phạm vi review)  |
| Approve / Reject item trong Review                                    |       —       |            —            |             —             |            ✅            |        ❌ (QT-04)        |               ❌               |
| Ký điện tử (nếu bật)                                                  |       —       |            —            |             —             |    ✅ (nếu is_signer)    |            ❌            |               ❌               |
| Xem Stats tab (Participant/Item Progress)                             |      ✅       |            —            |            ✅             |            ❌            |            ❌            |               ❌               |
| Thực thi Test Run, ghi nhận Defect                                    |       —       |           ✅            |             —             |            —             |            —             |               ❌               |

\* Trừ khi là `reviewer_limited` license — nhóm này **không có quyền truy cập read-only project**, chỉ thấy nội dung qua Review Center (QT-08).

**Câu hỏi chưa chốt liên quan trực tiếp bảng này:** "Được cấp quyền khởi tạo review" (Project Member) hiện chưa có cơ chế phân quyền chi tiết trong BRD/DB — tạm coi **mọi Project Member đều có quyền Start a Review**; nếu khách hàng muốn giới hạn (ví dụ chỉ số ít người), cần bổ sung 1 permission flag trong `project_members` hoặc 1 field mới.

---

## 3. Workflow / State Machine

BRD mô tả hành vi nhưng chưa hệ thống hoá thành state machine tường minh — cần làm rõ trước khi thiết kế UI để tránh sinh ra trạng thái/transition không hợp lệ.

### 3.1 Review — trạng thái tổng thể (`reviews.status`)

```
draft → active → closed_for_feedback → finalized
                       ↕
                   archived
```

| Trạng thái          | Ý nghĩa                                 | Ai được vào                   | Hành động cho phép                                                          | Điều kiện thoát                                                    |
| ------------------- | --------------------------------------- | ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| draft               | Đang cấu hình wizard, chưa gửi          | Moderator                     | Sửa toàn bộ config                                                          | Nhấn "Initiate" → active (BR-REV-09)                               |
| active              | Đang thu thập feedback                  | Moderator, Approver, Reviewer | Comment, Approve/Reject, Mark reviewed, Moderator sửa item/publish revision | Moderator "Close for Feedback" → closed_for_feedback               |
| closed_for_feedback | Khoá góp ý, Moderator làm việc quản trị | Moderator                     | Batch edit/transition (QT-09), Archive, hoặc mở lại                         | → archived, hoặc → finalized (nếu Approval review đã đủ điều kiện) |
| archived            | Lưu trữ, tạm dừng                       | Moderator                     | Recover → quay lại closed_for_feedback                                      | → closed_for_feedback (Recover)                                    |
| finalized           | Kết thúc, đã chốt baseline cuối         | — (read-only)                 | Không còn thao tác                                                          | Trạng thái cuối, không quay lại                                    |

**Transition không hợp lệ cần chặn tường minh:** `active → finalized` (phải qua `closed_for_feedback` trước — vì QT-09 yêu cầu Close for Feedback trước khi làm tác vụ quản trị); `finalized → *` (không thể mở lại review đã finalize, khác với archived).

### 3.2 Review Item Status — theo từng participant, theo từng revision (`review_item_status.status`)

```
Reviewer:   not_reviewed → reviewed
Approver:   not_reviewed → approved
                        ↘ rejected
```

- QT-04: Reviewer và Approver **không dùng chung bộ trạng thái** — Reviewer không có approve/reject, Approver không có "reviewed" đơn thuần.
- QT-05: Khi Moderator **Publish New Revision**, mọi trạng thái ở revision cũ **không bị xoá** (giữ audit) nhưng **không còn hiệu lực** — participant bắt buộc thao tác lại trên `revision_number` mới, bắt đầu lại từ `not_reviewed`.
- QT-06: Nếu tồn tại ≥ 1 item ở trạng thái `rejected` tại revision hiện tại → **chặn hoàn toàn** hành động ký điện tử / hoàn tất review; hệ thống chỉ hiển thị lựa chọn "Request a new revision".

### 3.3 Suspect Flag (`item_relationships.is_suspect`)

```
cleared --(upstream item thay đổi)--> suspect --(user Clear sau khi rà soát)--> cleared
```

- QT-02: Chỉ set `is_suspect = true` cho item downstream **liền kề trực tiếp** (1 cấp) — không tự động lan sang cấp thứ 2 trở đi. Đây là rule dễ bị hiểu sai khi code, nên đưa vào test case bắt buộc.

### 3.4 Test Run (`test_runs.overall_result`)

```
not_run → pass / fail / pass_with_errors / blocked
```

- Trạng thái tổng (overall_result) được suy ra từ trạng thái từng bước (`test_run_steps.result`) theo quy tắc BR-TEST-04: Pass = mọi bước pass; Fail = có bước fail; Blocked = không thể hoàn thành bước; Pass with errors = lỗi nhỏ. **Cần khách hàng xác nhận rõ ranh giới "lỗi nhỏ" (pass_with_errors) khác "fail" ở tiêu chí nào** — hiện BRD chỉ mô tả khái quát.

---

## 4. WBS — Epic / Feature (theo mã BR để truy vết ngược BRD)

| Epic                                             | Feature chính                                                                                                                                                                                                                                                                                                                                                                                                          | BR liên quan                                                | Độ phức tạp tương đối                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| **E0 — Nền tảng**                                | Đăng nhập, Home, Dashboard, Explorer, List View, Reading View, Search/Filter                                                                                                                                                                                                                                                                                                                                           | BR-NAV-01→07                                                | M                                             |
| **E1 — Cấu hình Admin**                          | Cấu hình Item Type + field, Relationship Type, cấu trúc Project/Folder                                                                                                                                                                                                                                                                                                                                                 | BR-NAV-08, item_types, item_type_fields, relationship_types | M                                             |
| **E2 — Quản lý Item**                            | Item Editor (rich text), nhập tay + reuse (import Word/Excel **dời sang Phase 4** — xem Q4), Versioning + Compare (redline/greenline), Lock khi sửa, Subscribe, Bulk update. Seed item type: **Requirement, Use Case, Test Case** (Q5 — không có Defect/Epic ở MVP này).                                                                                                                                               | BR-ITEM-01→09                                               | **L**                                         |
| **E3 — Truy vết**                                | Relationship CRUD, Suspect flag tự động, Impact Analysis, Trace View + export CSV                                                                                                                                                                                                                                                                                                                                      | BR-TRACE-01→06, QT-02, QT-03                                | M                                             |
| **E4 — Cộng tác (Stream)**                       | Stream 3 cấp, comment/@mention/hashtag/action, reply, email reply-to-stream, Connected Users                                                                                                                                                                                                                                                                                                                           | BR-COLLAB-01→07                                             | M                                             |
| **E5 — Review: Khởi tạo**                        | 3 cách gửi review, wizard (deadline, attachment, upstream/downstream context, template Approval/Peer), thêm participant theo user/group, email mời tuỳ biến                                                                                                                                                                                                                                                            | BR-REV-01→09, QT-07                                         | **L**                                         |
| **E6 — Review: Thực hiện**                       | Giao diện Review Center, comment theo đoạn, nhãn comment, checkbox reviewed, Approve/Reject + batch, mention, preview attachment, redline khi có revision mới, complete review + thống kê, chặn hoàn tất khi có reject (QT-06, độc lập với e-signature nên làm ngay). **E-signature thật (re-auth + hiển thị ý nghĩa chữ ký) dời sang Phase 4 (Q2)** — trong lúc chờ, Phase 2-3 dùng Peer Review làm luồng demo chính. | BR-REV-10→24, QT-04, QT-06                                  | **L (lớn nhất)**                              |
| **E7 — Review: Điều phối**                       | Thêm/bớt moderator/participant, Stats (Participant/Item Progress), Feedback tab tổng hợp, sửa item + resolve trong review, pending updates, Publish Revision, Batch transition/edit, Close for Feedback, Archive/Recover, Finalize                                                                                                                                                                                     | BR-REV-25→37, QT-05, QT-09                                  | **L**                                         |
| **E8 — Baseline & Báo cáo Review**               | Auto-baseline khi initiate/publish, Review Center Stats Report, Baseline Compare-to-current, Baseline Comparison Report                                                                                                                                                                                                                                                                                                | BR-REV-38→41                                                | M                                             |
| **E9 — Test Management** _(Phase riêng, xem Q1)_ | Test Case + steps, Test Plan + tester/environment, Test Cycle (exclude passed), Test Run + kết quả, Defect từ Test Run, Coverage Explorer, báo cáo Test Plan                                                                                                                                                                                                                                                           | BR-TEST-01→07                                               | M                                             |
| **E10 — Cross-cutting**                          | Notification (email cho mọi sự kiện ở Mục NFR "Thông báo"), Audit log cho hành động nhạy cảm                                                                                                                                                                                                                                                                                                                           | NFR-Thông báo, NFR-Lưu vết & Kiểm toán                      | S/M — làm song song, không phải 1 phase riêng |

_(S = nhỏ, M = trung bình, L = lớn — đánh giá định tính dựa trên số lượng BR và độ phức tạp state machine, không phải ước lượng thời gian cụ thể vì BRD Chương 8 "Hiệu năng" chưa có số liệu người dùng/quy mô làm cơ sở ước lượng — cần khách hàng bổ sung trước khi cam kết timeline theo ngày/sprint.)_

---

## 5. Phân kỳ triển khai (Phasing) & Phụ thuộc

### 5.1 Sơ đồ phụ thuộc

```
E0 (Nền tảng)
   ↓
E1 (Cấu hình Admin) ──→ E2 (Quản lý Item)
                             ↓         ↓
                         E3 (Truy vết)  E4 (Cộng tác)
                             ↓         ↓
                         E5 (Review: Khởi tạo)
                             ↓
                         E6 (Review: Thực hiện)
                             ↓
                         E7 (Review: Điều phối)
                             ↓
                         E8 (Baseline & Báo cáo)

E9 (Test Management) ──→ chỉ phụ thuộc E2 (Item), độc lập tương đối với nhánh Review
E10 (Notification/Audit) ──→ chạy song song, cắm vào mọi epic khác
```

### 5.2 Đề xuất 4 Phase

| Phase                                                     | Nội dung          | Lý do sắp xếp                                                                                                                                                                                               |
| --------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 1 — Nền tảng dữ liệu**                            | E0 + E1 + E2 + E3 | Đây là "system of record" cốt lõi — mọi module khác (Review, Test) đều thao tác trên Item, nên phải ổn định trước. Đồng thời **bắt buộc chốt Q5 (item type) và Q8 (multi-tenant) trước khi vào phase này**. |
| **Phase 2 — Cộng tác & Review cơ bản**                    | E4 + E5 + E6      | Đưa được 1 vòng đời review đơn giản (khởi tạo → reviewer/approver thao tác → complete) vào demo được sớm — đây là giá trị lõi của "JAMA-clone" theo Mục tiêu nghiệp vụ BRD Ch.5.                            |
| **Phase 3 — Review nâng cao**                             | E7 + E8           | Phần điều phối (moderator) và baseline/báo cáo phụ thuộc hoàn toàn vào việc E5/E6 đã chạy đúng — không thể làm song song vì cùng chỉnh sửa trên `reviews`/`review_item_status`.                             |
| **Phase 4 — Test Management** _(có thể cắt/dời — xem Q1)_ | E9                | Độc lập tương đối, có thể chạy song song với Phase 2/3 nếu có đủ nhân lực tách team, hoặc dời hẳn sang giai đoạn 2 của dự án nếu cần rút gọn MVP theo đúng gợi ý của khách hàng ở BRD Ch.10 Q1.             |

E10 (Notification & Audit log) không phải 1 phase riêng — triển khai dạng "shared service" ngay từ Phase 1, mở rộng dần theo từng epic (mỗi epic bổ sung sự kiện notification/audit tương ứng khi hoàn thành).

---

## 6. Rủi ro & Giả định

| #   | Rủi ro / Giả định                                                                                                   | Loại                | Xác suất                | Tác động                                                                    | Giảm thiểu                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | Review Center (E5-E8) là ~55% khối lượng nghiệp vụ Must/Should nhưng lại phụ thuộc chuỗi dài (E2→E3/E4→E5→E6→E7→E8) | Kỹ thuật/Lịch trình | Cao                     | Cao — dễ trễ toàn bộ MVP nếu Phase 1 kéo dài                                | Chốt Q5/Q8 sớm; ưu tiên resource mạnh nhất cho Phase 2-3; demo sớm 1 vòng đời review tối giản (E5+E6 Must-only) trước khi làm đủ E7/E8     |
| R2  | Danh sách item type/field (Q5) chưa chốt                                                                            | Nghiệp vụ           | Cao                     | Cao — ảnh hưởng `item_types`, `item_type_fields`, UI Item Editor, seed data | Bắt buộc workshop với khách hàng trước khi code Phase 1, không code "tạm" rồi sửa sau                                                      |
| R3  | Custom field lưu JSONB (A2, DB schema) — khó filter/sort hiệu năng cao khi số lượng custom field lớn                | Kỹ thuật            | Trung bình              | Trung bình                                                                  | Theo dõi số lượng custom field thực tế; bổ sung GIN index hoặc tách EAV nếu vượt ngưỡng chấp nhận được (cần benchmark khi có dữ liệu thật) |
| R4  | Chữ ký điện tử chỉ mô phỏng UI (Q2) nhưng khách hàng có thể kỳ vọng giá trị pháp lý thật                            | Nghiệp vụ/Pháp lý   | Trung bình              | Cao nếu hiểu nhầm                                                           | Ghi rõ trong tài liệu bàn giao & UAT rằng e-signature không tuân thủ 21 CFR Part 11                                                        |
| R5  | Gửi email qua SMTP thật (Q7) phụ thuộc dịch vụ ngoài, có thể lỗi/chậm                                               | Vận hành            | Trung bình              | Trung bình                                                                  | Thiết kế notification là async job (không block transaction chính — xem Mục 8), có retry và log song song                                  |
| R6  | Chưa có chỉ tiêu hiệu năng cụ thể (số user đồng thời, số item/dự án) — BRD Ch.8 để trống                            | Nghiệp vụ           | Cao                     | Trung bình                                                                  | Không tự đặt SLA/con số tuỳ tiện; yêu cầu khách hàng cung cấp trước khi cam kết NFR chính thức                                             |
| R7  | Multi-tenant (Q8) nếu cần bổ sung sau khi đã có dữ liệu thật                                                        | Kỹ thuật            | Thấp (nếu xác nhận sớm) | Rất cao nếu xảy ra muộn                                                     | Xác nhận Q8 **trước khi bắt đầu Phase 1**, không lùi lại                                                                                   |

---

## 7. Acceptance Criteria — các luồng trọng yếu (mẫu Given/When/Then)

```
AC-01 (QT-01 — Khoá item khi sửa)
Given một item đang được User A mở để chỉnh sửa
When User B cố gắng mở cùng item đó để sửa
Then hệ thống chặn User B và thông báo item đang được khoá bởi User A

AC-02 (QT-02 — Suspect flag chỉ lan 1 cấp)
Given Item R1 (upstream) có quan hệ tới Item T1 (downstream trực tiếp), và Item T1 tiếp tục có quan hệ tới Item T2
When Item R1 bị chỉnh sửa
Then Item T1 được gắn cờ suspect
And Item T2 KHÔNG tự động bị gắn cờ suspect

AC-03 (QT-06 — Chặn hoàn tất review khi còn reject)
Given một Approval Review có ít nhất 1 item ở trạng thái rejected tại revision hiện tại
When participant cố gắng hoàn tất review (ký điện tử / complete)
Then hệ thống chặn hành động này
And chỉ hiển thị lựa chọn "Request a new revision"

AC-04 (QT-05 — Publish revision reset trạng thái)
Given một review đang active với một số item đã được approve/reviewed ở revision N
When Moderator Publish New Revision (tạo revision N+1)
Then trạng thái approve/reject/reviewed của mọi participant cho mọi item được reset về "not_reviewed" ở revision N+1
And dữ liệu trạng thái ở revision N vẫn được giữ nguyên phục vụ audit

AC-05 (QT-08 — Reviewer license hạn chế)
Given một participant có license_type = reviewer_limited được thêm vào review có bật "include upstream/downstream context"
When participant này mở Review Center
Then participant thấy được item chính và các item upstream/downstream được đính kèm ngữ cảnh
And participant KHÔNG thể truy cập Explorer/List View của project ngoài phạm vi review
```

---

## 8. Kiến trúc đề xuất (Architecture Decision)

Theo nguyên tắc "chọn kiến trúc đơn giản nhất đáp ứng được yêu cầu" (không thêm phức tạp vì nghe "cho có vẻ enterprise"):

| Phương án                                                         | Mô tả                                                                                                                                                                                                                                    | Đánh giá                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Modular Monolith** _(khuyến nghị)_                          | 1 ứng dụng duy nhất, chia module theo đúng nhóm bảng đã thiết kế trong Database Schema Mục 1 (item, review, test, traceability, collaboration, cross-cutting); notification chạy dưới dạng background job/queue nội bộ (không cần Kafka) | Phù hợp MVP: đơn giản vận hành, transaction nội bộ dễ đảm bảo tính nhất quán (ví dụ: publish revision phải reset trạng thái + tạo baseline + gửi notification trong cùng 1 nghiệp vụ)                                                                                                     |
| B — Monolith không phân module rõ ràng                            | Code chung 1 khối, không tách boundary                                                                                                                                                                                                   | Nhanh ban đầu nhưng rủi ro cao: Review Center (E5-E8) rất phức tạp, nếu không tách module sẽ khó bảo trì/test độc lập                                                                                                                                                                     |
| C — Microservices (Item service, Review service, Test service...) | Tách theo domain thành các service độc lập                                                                                                                                                                                               | **Không khuyến nghị cho MVP**: chưa có driver nghiệp vụ nào đòi hỏi scale độc lập từng phần; suspect flag (xuyên Item↔Traceability) và baseline (xuyên Review↔Item version) cần join dữ liệu chặt chẽ — tách service sẽ phát sinh distributed transaction không cần thiết ở giai đoạn này |

**Quyết định:** Phương án A — Modular Monolith.

```
Vấn đề: Cần kiến trúc đủ rõ ràng để quản lý 1 module lớn (Review Center) mà không phức tạp hoá vận hành MVP.
Lý do: Modular monolith cho phép tách rõ boundary theo domain (giống 8 nhóm bảng đã thiết kế) mà vẫn giữ transaction đơn giản, triển khai 1 lần.
Phương án đơn giản hơn đã cân nhắc: Monolith không chia module — bị loại vì độ phức tạp của Review Center (13 bảng, nhiều state machine) cần ranh giới rõ để nhiều dev làm song song không giẫm code nhau.
Đánh đổi: Cần kỷ luật giữ module boundary (không gọi thẳng vào bảng của module khác), nhưng đổi lại vẫn dễ tách thành service riêng sau này nếu thực sự cần scale (ví dụ Review Center tách riêng khi có nhiều khách hàng lớn).
```

---

## 9. Câu hỏi mở cần khách hàng xác nhận TRƯỚC khi bắt đầu Phase 1

Các câu Q1, Q2, Q3, Q4, Q6, Q7 đã có quyết định tạm thời ở Mục 1 và có thể tiếp tục triển khai song song trong khi chờ xác nhận chính thức, vì mức độ ảnh hưởng schema/kiến trúc thấp hơn và dễ điều chỉnh sau.

---

_Tài liệu ở mức kế hoạch (planning level) — chưa bao gồm sprint plan theo ngày/tuần cụ thể vì chưa có input về quy mô team và tốc độ (velocity), theo đúng nguyên tắc không tự đặt con số khi chưa có cơ sở (BRD Chương 8 "Hiệu năng" cũng đang để trống vì lý do tương tự)._
