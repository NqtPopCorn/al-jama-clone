# BRD — Dự án JAMA-clone MVP

## TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT – BRD)

**DỰ ÁN:** JAMA-CLONE MVP
**Nền tảng:** quản lý yêu cầu, kiểm thử, truy vết & review — mô phỏng lại Jama Connect

- **Phiên bản:** 1.0 — Bản nháp để khách hàng đánh giá (Draft for Client Review)
- **Ngày lập:** 05/09/2026
- **Phạm vi căn cứ:** 10 video đầu tiên trong playlist "Getting Started with Jama Connect" & "Jama Connect® Review Center"

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
   - 1.1 Mục đích tài liệu
   - 1.2 Căn cứ xây dựng tài liệu
2. [Phạm vi dự án (Scope)](#2-phạm-vi-dự-án-scope)
   - 2.1 Trong phạm vi MVP (In-scope)
   - 2.2 Ngoài phạm vi MVP (Out-of-scope)
3. [Đối tượng liên quan & Vai trò người dùng](#3-đối-tượng-liên-quan--vai-trò-người-dùng)
   - 3.1 Đối tượng liên quan (Stakeholders)
   - 3.2 Vai trò người dùng trong hệ thống
4. [Giả định & Ràng buộc](#4-giả-định--ràng-buộc)
   - 4.1 Giả định (Assumptions)
   - 4.2 Ràng buộc (Constraints)
5. [Mục tiêu nghiệp vụ (Business Objectives)](#5-mục-tiêu-nghiệp-vụ-business-objectives)
6. [Yêu cầu chức năng chi tiết theo module](#6-yêu-cầu-chức-năng-chi-tiết-theo-module)
   - 6.1 Đăng nhập & Điều hướng chung
   - 6.2 Quản lý Item (Item Management)
   - 6.3 Cộng tác (Collaboration / Stream)
   - 6.4 Quản lý kiểm thử (Test Management)
   - 6.5 Truy vết (Traceability)
   - 6.6 Trung tâm Review (Review Center)
     - 6.6.1 Khởi tạo Review
     - 6.6.2 Thực hiện Review (Reviewer / Approver)
     - 6.6.3 Điều phối Review (Moderator)
     - 6.6.4 Baseline & Báo cáo
7. [Quy tắc nghiệp vụ tổng hợp (Business Rules)](#7-quy-tắc-nghiệp-vụ-tổng-hợp-business-rules)
8. [Yêu cầu phi chức năng (Non-Functional Requirements)](#8-yêu-cầu-phi-chức-năng-non-functional-requirements)
9. [Tiêu chí nghiệm thu MVP (Acceptance Criteria)](#9-tiêu-chí-nghiệm-thu-mvp-acceptance-criteria)
10. [Câu hỏi mở & Rủi ro cần khách hàng xác nhận](#10-câu-hỏi-mở--rủi-ro-cần-khách-hàng-xác-nhận)

- [Phụ lục A — Bảng ánh xạ Video nguồn → Module chức năng](#phụ-lục-a--bảng-ánh-xạ-video-nguồn--module-chức-năng)
- [Phụ lục B — Bảng thuật ngữ (Glossary)](#phụ-lục-b--bảng-thuật-ngữ-glossary)
- [Ghi chú kiểm soát tài liệu (Document Control)](#ghi-chú-kiểm-soát-tài-liệu-document-control)

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này mô tả các yêu cầu nghiệp vụ (Business Requirements) cho phiên bản MVP (Minimum Viable Product) của dự án "JAMA-clone" — một nền tảng quản lý yêu cầu (requirements management), kiểm thử (test management), truy vết (traceability) và review cộng tác, được xây dựng dựa trên việc phân tích 10 video đầu tiên của bộ tài liệu hướng dẫn Jama Connect chính hãng. Mục tiêu của tài liệu là để đội ngũ dự án và khách hàng cùng thống nhất phạm vi (scope), các luồng nghiệp vụ chính, quy tắc nghiệp vụ và ranh giới MVP trước khi bước vào giai đoạn thiết kế UI/UX và phát triển.

### 1.2 Căn cứ xây dựng tài liệu

- Phụ đề gốc (transcript) của 10 video trong file "playlist_transcripts.json" do khách hàng/đội dự án cung cấp — không suy diễn thêm nội dung ngoài lời thoại thực tế.
- Tài liệu "Kiểm kê màn hình & chức năng theo từng video" (v2.0, 05/09/2026) — bảng phân tích chi tiết từng màn hình, chức năng, thời điểm xuất hiện (timestamp) và mô tả ngắn cho từng video.

> **Ghi chú:** Mọi yêu cầu trong tài liệu này đều được trích xuất và diễn giải từ nội dung của 10 video nêu trên. Các mục đánh dấu "Cần xác nhận" là những điểm mà nội dung video mô tả ở mức khái quát, cần khách hàng làm rõ thêm trước khi đưa vào thiết kế chi tiết.

---

## 2. Phạm vi dự án (Scope)

### 2.1 Trong phạm vi MVP (In-scope)

Phạm vi MVP được xác định là toàn bộ nghiệp vụ được thể hiện trong 10 video sau:

| #   | Video nguồn                                                            | Nhóm nghiệp vụ chính                                         |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | Getting Started with Jama Connect: Introduction                        | Đăng nhập, điều hướng chung, khái niệm Item/System of record |
| 2   | Getting Started with Jama Connect: Collaboration                       | Stream, bình luận, @mention, Connected Users                 |
| 3   | Getting Started with Jama Connect: Testing                             | Test case, test plan, test cycle, test run, defect, coverage |
| 4   | Getting Started with Jama Connect: Working with information            | Tạo/sửa item, versioning, subscribe, bulk update             |
| 5   | Getting Started with Jama Connect: Traceability                        | Relationship, suspect flag, impact analysis, trace view      |
| 6   | Getting Started with Jama Connect: Reviews                             | Tổng quan quy trình review (giới thiệu 3 vai trò)            |
| 7   | Jama Connect® Review Center - Overview                                 | Trọn vòng đời 1 review: khởi tạo → thực hiện → hoàn tất      |
| 8   | Jama Connect® Review Center - Providing Feedback                       | Góc nhìn reviewer/approver khi tham gia review               |
| 9   | Jama Connect® Review Center - Understanding Review Baselines and Stats | Baseline, thống kê, báo cáo review                           |
| 10  | Jama Connect® Review Center - Moderating a Review                      | Góc nhìn điều phối viên (moderator)                          |

### 2.2 Ngoài phạm vi MVP (Out-of-scope)

Các video từ #11 đến #17 trong playlist gốc không thuộc phạm vi phân tích của tài liệu này và do đó **KHÔNG** nằm trong scope MVP, bao gồm:

- Video 11 — Jama Connect Free Trial (luồng đăng ký dùng thử)
- Video 12 — Tighten Control Over Project Costs, Compliance, and Completion (nội dung định vị sản phẩm/marketing)
- Video 13 — Building the Blueprint: Applying Requirements Management (case study khách hàng)
- Video 14 — Standardizing Requirements Management Across the tổ chức (case study)
- Video 15 — Write Better Requirements with Jama Connect Advisor™ (tính năng AI hỗ trợ viết yêu cầu)
- Video 16 — Transform Engineering Processes: Bridge Gaps Between Teams (case study đa nhóm kỹ thuật)
- Video 17 — Accelerate Your ECSS Standards Compliance (tuân thủ chuẩn ngành ECSS)

Ngoài ra, các hạng mục sau cũng được xem là ngoài phạm vi MVP dù có liên quan gián tiếp đến 10 video trong scope, vì mức độ phức tạp kỹ thuật/pháp lý vượt quá MVP:

- Tích hợp với hệ thống bên thứ ba (Jira, ALM, SSO/LDAP thật, email server thật).
- Ứng dụng di động (mobile app) hoặc chế độ offline.
- Bộ máy cấu hình quy tắc nghiệp vụ (rule builder) đầy đủ cho Admin — MVP có thể dùng cấu hình mặc định/đơn giản hóa.
- Giá trị pháp lý đầy đủ của chữ ký điện tử (tuân thủ 21 CFR Part 11 hoặc tương đương) — MVP chỉ mô phỏng luồng UI/UX của việc ký.
- Xuất báo cáo phục vụ hệ thống quản lý chất lượng (QMS) chính thức, kiểm toán bên ngoài.

---

## 3. Đối tượng liên quan & Vai trò người dùng

### 3.1 Đối tượng liên quan (Stakeholders)

| Đối tượng                                  | Vai trò trong dự án                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Khách hàng / Chủ đầu tư                    | Phê duyệt phạm vi, xác nhận yêu cầu nghiệp vụ trong tài liệu này             |
| Đội phát triển sản phẩm (Product/Dev team) | Thiết kế & xây dựng hệ thống dựa trên BRD đã duyệt                           |
| Người dùng cuối — Project Member           | Tạo, chỉnh sửa, truy vết item; tham gia review với vai trò Reviewer/Approver |
| Người dùng cuối — Project Administrator    | Cấu hình loại item, cấu trúc dự án, quy tắc quan hệ, template review         |

### 3.2 Vai trò người dùng trong hệ thống

| Vai trò                       | Mô tả quyền hạn chính                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator (Quản trị viên) | Cấu hình loại item, trường dữ liệu bắt buộc/tùy chọn, cấu trúc dự án, quy tắc quan hệ (required/optional), template review (Approval/Peer).                     |
| Project Member / Creator      | Tạo, sửa, xóa item; tạo quan hệ truy vết; khởi tạo review (nếu được cấp quyền); thực hiện kiểm thử.                                                             |
| Moderator                     | Khởi tạo & điều phối review: cấu hình wizard, thêm/bớt participant, xử lý feedback, publish revision, đóng/khôi phục review.                                    |
| Approver                      | Xem xét nội dung được gửi review; Approve hoặc Reject từng item; ký điện tử (nếu bật); có thể đề xuất thay đổi (proposed change).                               |
| Reviewer                      | Xem xét nội dung, để lại bình luận, đánh dấu "đã xem"; KHÔNG có quyền approve/reject (khác Approver).                                                           |
| Reviewer license (giới hạn)   | Loại tài khoản không có quyền truy cập read-only vào project — chỉ xem được nội dung qua Review Center (kể cả upstream/downstream item được đính kèm ngữ cảnh). |

---

## 4. Giả định & Ràng buộc

### 4.1 Giả định (Assumptions)

- Hệ thống MVP hoạt động dưới dạng web app truy cập qua trình duyệt hiện đại, không yêu cầu cài đặt phần mềm phía người dùng.
- Mỗi tổ chức khách hàng có một không gian làm việc (workspace/URL) riêng biệt.
- Email thông báo (mời review, mention, subscribe...) được gửi qua một dịch vụ email chuẩn (SMTP) đã cấu hình sẵn cho môi trường MVP.
- Dữ liệu mẫu ban đầu (loại item, project, user) có thể được khởi tạo thủ công cho mục đích demo/UAT.

### 4.2 Ràng buộc (Constraints)

- Thời gian & nguồn lực MVP có giới hạn — các module được ưu tiên theo mức độ "Bắt buộc / Nên có / Cân nhắc" nêu trong Chương 6.
- Không phát triển các tính năng thuộc phần "Ngoài phạm vi MVP" (Chương 2.2) trong giai đoạn này.
- Các thuật ngữ, nhãn màn hình trong tài liệu tạm dùng theo đúng thuật ngữ gốc của Jama Connect (ví dụ: Stream, Explorer, Baseline) để tiện đối chiếu; tên gọi thương mại cuối cùng cho sản phẩm clone sẽ do khách hàng quyết định.

---

## 5. Mục tiêu nghiệp vụ (Business Objectives)

Dựa trên thông điệp giá trị được truyền tải xuyên suốt 10 video (đặc biệt Video 1, 2, 6), hệ thống MVP hướng đến các mục tiêu sau:

- Thay thế việc quản lý yêu cầu bằng tài liệu Word/Excel rời rạc bằng một "hệ thống ghi nhận" (system of record) tập trung, chia nhỏ nội dung thành từng item có thể thao tác độc lập.
- Giảm thất lạc thông tin trao đổi (email, ghi chú giấy, cuộc họp) bằng cách tập trung toàn bộ thảo luận vào Stream gắn liền với item/dự án.
- Đảm bảo tính truy vết hai chiều (traceability) giữa yêu cầu – use case – test case – defect, tự động cảnh báo khi có thay đổi ảnh hưởng dây chuyền (suspect flag).
- Số hoá quy trình review/phê duyệt nội dung dự án, thay thế việc gửi tài liệu qua email và tổng hợp phản hồi thủ công.
- Cung cấp bằng chứng lịch sử đầy đủ (version, baseline) phục vụ nhu cầu đối chiếu & kiểm tra sau này.

---

## 6. Yêu cầu chức năng chi tiết theo module

Mỗi yêu cầu được gắn mã (BR-xxx-##) để tiện tham chiếu, kiểm thử và truy vết ngược lại video nguồn. Cột "Ưu tiên" áp dụng thang MoSCoW rút gọn: **Bắt buộc (Must)** / **Nên có (Should)** / **Cân nhắc (Could)**.

### 6.1 Đăng nhập & Điều hướng chung

_Nguồn: Video 1 — Getting Started with Jama Connect: Introduction._

| Mã        | Yêu cầu nghiệp vụ                                                                                                       | Nguồn   | Ưu tiên         |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ------- | --------------- |
| BR-NAV-01 | Người dùng đăng nhập bằng URL riêng của tổ chức, qua bất kỳ trình duyệt hiện đại nào, không cần cài đặt phần mềm riêng. | Video 1 | Bắt buộc (Must) |
| BR-NAV-02 | Sau đăng nhập, Trang chủ (Home) hiển thị tổng hợp các dự án/mục công việc mà người dùng đang xử lý.                     | Video 1 | Bắt buộc (Must) |
| BR-NAV-03 | Khi mở một dự án, Dashboard hiển thị thông tin mức cao (high-level) về tiến độ của dự án đó.                            | Video 1 | Nên có (Should) |
| BR-NAV-04 | Explorer hiển thị cấu trúc dự án dạng cây phân cấp (folder/set), cho phép truy cập tới mọi phần của dự án.              | Video 1 | Bắt buộc (Must) |
| BR-NAV-05 | List View hiển thị mỗi item là 1 dòng với các cột tuỳ biến được (tương tự bảng tính Excel).                             | Video 1 | Bắt buộc (Must) |
| BR-NAV-06 | Reading View hiển thị nội dung liền mạch dạng tài liệu (giống Word), phù hợp để đọc/rà soát.                            | Video 1 | Nên có (Should) |
| BR-NAV-07 | Thanh tìm kiếm & bộ lọc cho phép tìm nhanh hoặc lọc danh sách item theo điều kiện.                                      | Video 1 | Bắt buộc (Must) |
| BR-NAV-08 | Administrator có thể cấu hình loại item và cấu trúc dự án để khớp với quy trình nghiệp vụ riêng của tổ chức.            | Video 1 | Nên có (Should) |

### 6.2 Quản lý Item (Item Management)

_Nguồn: Video 1, Video 4 — Working with information._

| Mã         | Yêu cầu nghiệp vụ                                                                                                                                                                                 | Nguồn      | Ưu tiên         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- |
| BR-ITEM-01 | Toàn bộ tri thức dự án (yêu cầu, thảo luận, thay đổi, kết quả kiểm thử) được lưu tập trung trong một "hệ thống ghi nhận" (system of record) duy nhất, các phần liên kết & truy vết được với nhau. | Video 1    | Bắt buộc (Must) |
| BR-ITEM-02 | Một tài liệu Word/Excel lớn chứa nhiều yêu cầu có thể được chia nhỏ thành từng item riêng lẻ, thao tác/gửi review độc lập.                                                                        | Video 1    | Bắt buộc (Must) |
| BR-ITEM-03 | Hệ thống hỗ trợ 3 cách thêm item: nhập tay, import từ file, hoặc tái sử dụng (reuse) item có sẵn.                                                                                                 | Video 4    | Nên có (Should) |
| BR-ITEM-04 | Item Editor cho phép nhập tên, mô tả dạng rich text (chèn hình ảnh, bảng, hyperlink, định dạng), người phụ trách (assignee), priority và các trường khác tuỳ theo loại item.                      | Video 1, 4 | Bắt buộc (Must) |
| BR-ITEM-05 | Administrator quyết định trường thông tin nào là bắt buộc/tuỳ chọn cho từng loại item; hỗ trợ template khác nhau cho từng loại item nếu được thiết lập.                                           | Video 1, 4 | Nên có (Should) |
| BR-ITEM-06 | Mỗi lần chỉnh sửa item, hệ thống tự động tạo một version mới; chỉ một người được sửa một item tại một thời điểm (khoá để tránh ghi đè lẫn nhau).                                                  | Video 4    | Bắt buộc (Must) |
| BR-ITEM-07 | Tab "Versions" trên mỗi item cho phép xem và so sánh (compare) hai version bất kỳ; nội dung bị xoá hiển thị gạch ngang màu đỏ, nội dung thêm mới hiển thị màu xanh.                               | Video 4    | Bắt buộc (Must) |
| BR-ITEM-08 | Người dùng có thể Subscribe vào một item để nhận email thông báo mỗi khi item đó được chỉnh sửa.                                                                                                  | Video 4    | Nên có (Should) |
| BR-ITEM-09 | Cho phép chọn nhiều item cùng lúc để cập nhật hàng loạt (bulk update) các trường như priority, status.                                                                                            | Video 4    | Nên có (Should) |

### 6.3 Cộng tác (Collaboration / Stream)

_Nguồn: Video 2 — Getting Started with Jama Connect: Collaboration._

| Mã           | Yêu cầu nghiệp vụ                                                                                                                                                                                                            | Nguồn   | Ưu tiên          |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------- |
| BR-COLLAB-01 | Hệ thống có 3 cấp độ Stream: (1) cấp một item riêng lẻ, (2) cấp trang chủ dự án (toàn bộ hoạt động của dự án), (3) cấp toàn tổ chức (menu trên cùng, tổng hợp mọi dự án).                                                    | Video 2 | Bắt buộc (Must)  |
| BR-COLLAB-02 | Người dùng thêm bình luận trong Stream, có thể @mention người dùng khác, nhóm, hoặc item khác ngay trong nội dung bình luận.                                                                                                 | Video 2 | Bắt buộc (Must)  |
| BR-COLLAB-03 | Người dùng có thể gắn hashtag tuỳ chỉnh (#) vào bình luận để giúp tìm lại sau này.                                                                                                                                           | Video 2 | Cân nhắc (Could) |
| BR-COLLAB-04 | Người dùng có thể gắn một "yêu cầu hành động" (request action) vào bình luận; người khác có thể đánh dấu resolve khi đã xử lý.                                                                                               | Video 2 | Nên có (Should)  |
| BR-COLLAB-05 | Người dùng có thể trả lời (reply) một bình luận đã có để giữ mạch hội thoại; mọi tuỳ chọn (mention, hashtag, action) đều áp dụng được trong reply.                                                                           | Video 2 | Nên có (Should)  |
| BR-COLLAB-06 | Khi bị @mention, người dùng nhận được email thông báo và có thể trả lời trực tiếp qua email — phản hồi sẽ tự động được thêm vào Stream tương ứng.                                                                            | Video 2 | Nên có (Should)  |
| BR-COLLAB-07 | Mỗi item hiển thị biểu tượng "Connected Users" đếm số người đã thêm, sửa, bình luận, subscribe hoặc tương tác khác với item; bấm vào để xem chi tiết và mention trực tiếp từ danh sách đó (kể cả người chưa từng tương tác). | Video 2 | Cân nhắc (Could) |

### 6.4 Quản lý kiểm thử (Test Management)

_Nguồn: Video 3 — Getting Started with Jama Connect: Testing._

**Thuật ngữ nghiệp vụ:** Test case (bộ bước kiểm tra) → nhóm vào Test plan (kèm danh sách tester, môi trường test) → thực thi thành các Test run trong một Test cycle → nếu thất bại sẽ phát sinh Defect. Test coverage thể hiện mối liên kết giữa kiểm thử và yêu cầu.

| Mã         | Yêu cầu nghiệp vụ                                                                                                                                                                              | Nguồn   | Ưu tiên         |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------- |
| BR-TEST-01 | Tạo Test Case mới gồm tên, mô tả và danh sách các bước thực hiện (steps).                                                                                                                      | Video 3 | Bắt buộc (Must) |
| BR-TEST-02 | Tạo Test Plan gồm tên, danh sách tester, môi trường kiểm thử; kéo-thả (drag & drop) test case có sẵn vào plan hoặc import.                                                                     | Video 3 | Bắt buộc (Must) |
| BR-TEST-03 | Trong một Test Plan, tạo các Test Cycle; khi tạo cycle mới có thể chọn loại trừ các test case đã Pass ở cycle trước.                                                                           | Video 3 | Nên có (Should) |
| BR-TEST-04 | Thực thi Test Run: đánh dấu trạng thái từng bước; kết quả tổng của run là Pass (mọi bước pass), Fail (có bước fail), Pass with errors (lỗi nhỏ), hoặc Blocked (không thể hoàn thành các bước). | Video 3 | Bắt buộc (Must) |
| BR-TEST-05 | Cho phép ghi nhận một Defect trực tiếp ngay từ Test Run; defect tự động traceable tới test run và test case liên quan.                                                                         | Video 3 | Bắt buộc (Must) |
| BR-TEST-06 | Coverage Explorer cho phép truy vết defect ngược lên epic/requirement, xác nhận mọi yêu cầu đã được kiểm thử xác minh (verified).                                                              | Video 3 | Nên có (Should) |
| BR-TEST-07 | Cung cấp báo cáo Test Plan Summary và Test Plan Detail thể hiện trạng thái/tiến độ kiểm thử.                                                                                                   | Video 3 | Nên có (Should) |

> **Cần xác nhận với khách hàng:** do khối lượng nghiệp vụ Test Management khá lớn và độc lập tương đối với luồng Review, đề xuất đưa vào MVP ở mức "Bắt buộc" cho BR-TEST-01/02/04/05, các mục còn lại có thể dời sang giai đoạn kế tiếp nếu cần rút gọn phạm vi.

### 6.5 Truy vết (Traceability)

_Nguồn: Video 5 — Getting Started with Jama Connect: Traceability._

| Mã          | Yêu cầu nghiệp vụ                                                                                                                                                                                                                                        | Nguồn   | Ưu tiên         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------- |
| BR-TRACE-01 | Tạo quan hệ (relationship) giữa hai item có sẵn thông qua tab "Relationships" > nút "Relate Item".                                                                                                                                                       | Video 5 | Bắt buộc (Must) |
| BR-TRACE-02 | Cho phép tạo một item mới kèm sẵn quan hệ ngay lúc tạo (right-click > "Add Related Item").                                                                                                                                                               | Video 5 | Nên có (Should) |
| BR-TRACE-03 | Quan hệ có hướng: upstream hoặc downstream; có thể là bắt buộc (đường liền) hoặc tuỳ chọn (đường đứt nét) tuỳ theo quy tắc do Administrator cấu hình.                                                                                                    | Video 5 | Bắt buộc (Must) |
| BR-TRACE-04 | Khi một item upstream thay đổi, mọi item downstream liền kề (chỉ một cấp, không tự lan xa hai cấp trở lên) tự động được gắn cờ "suspect"; người dùng có thể Clear cờ sau khi rà soát và chỉnh sửa.                                                       | Video 5 | Bắt buộc (Must) |
| BR-TRACE-05 | Impact Analysis (report builder): chọn bộ lọc (hoặc để trống để xem tất cả) và xác định độ sâu truy vết lên/xuống, sau đó chạy báo cáo; kết quả tô màu item gốc và hiển thị toàn bộ item upstream/downstream liên quan, bấm vào ID để mở item tương ứng. | Video 5 | Nên có (Should) |
| BR-TRACE-06 | Trace View: hiển thị lưới quan hệ truy vết, có thể mở từ set, filter hoặc release; cho phép cuộn để xem toàn cảnh và xuất kết quả ra CSV, chia sẻ qua URL, hoặc bookmark về trang chủ.                                                                   | Video 5 | Nên có (Should) |

### 6.6 Trung tâm Review (Review Center)

_Nguồn: Video 6, 7, 8, 9, 10._ Đây là module có khối lượng nghiệp vụ lớn nhất trong scope MVP, được chia thành 4 nhóm luồng theo vai trò: (a) Khởi tạo review, (b) Thực hiện review (Reviewer/Approver), (c) Điều phối review (Moderator), (d) Baseline & Báo cáo.

#### 6.6.1 Khởi tạo Review

| Mã        | Yêu cầu nghiệp vụ                                                                                                                                                                                                                                                                                                       | Nguồn      | Ưu tiên         |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------- |
| BR-REV-01 | Hỗ trợ 3 cách gửi nội dung vào review: (a) tab "Reviews" > "Start a Review"; (b) chọn item trong Explorer > right-click > "Send for review"; (c) từ một bộ lọc (filter) đã lưu > right-click > "Send for review" (rolling review dựa trên workflow status).                                                             | Video 6, 7 | Bắt buộc (Must) |
| BR-REV-02 | Khi tạo từ filter, tên review được tự sinh theo tên filter; deadline mặc định là 1 tuần kể từ thời điểm tạo (cuối giờ làm việc theo giờ địa phương), có thể chỉnh sửa; dự án và danh sách item bị khoá vì đã do filter quyết định.                                                                                      | Video 7    | Nên có (Should) |
| BR-REV-03 | Cho phép tuỳ chọn đính kèm file (attachment) sẵn có của item vào review; reviewer cần có quyền dự án phù hợp mới xem được attachment.                                                                                                                                                                                   | Video 7    | Nên có (Should) |
| BR-REV-04 | Cho phép tuỳ chọn hiển thị thêm item liên quan Upstream và/hoặc Downstream để tăng ngữ cảnh cho reviewer, đặc biệt hữu ích với người dùng có license Reviewer hạn chế (không có quyền xem toàn dự án).                                                                                                                  | Video 7    | Nên có (Should) |
| BR-REV-05 | Cho phép chọn template review: "Approval Review" (do Administrator cấu hình sẵn, không thể sửa khi tạo — bắt buộc chữ ký điện tử, có vai trò signer, bật time tracking, cho phép approver tự thêm participant và delegate review) hoặc "Peer Review" (thiết lập tương tự nhưng moderator có thể tuỳ chỉnh lại khi tạo). | Video 7    | Bắt buộc (Must) |
| BR-REV-06 | Cho phép thêm participant theo từng người hoặc theo cả một user group; vai trò review (Reviewer/Approver) và vai trò signer được gán tự động nếu người dùng chỉ thuộc 1 nhóm, hoặc cần chọn thủ công nếu thuộc nhiều nhóm.                                                                                              | Video 7    | Bắt buộc (Must) |
| BR-REV-07 | Phân biệt rõ vai trò: Reviewer chỉ xác nhận đã xem và góp ý; Approver có quyền accept hoặc reject nội dung.                                                                                                                                                                                                             | Video 6, 7 | Bắt buộc (Must) |
| BR-REV-08 | Cho phép tuỳ chỉnh tiêu đề/nội dung email mời; email tự động mô tả vai trò của người nhận, ý nghĩa chữ ký (nếu là approver-signer), kèm link tới review và deadline.                                                                                                                                                    | Video 7    | Nên có (Should) |
| BR-REV-09 | Khi khởi tạo (Initiate review), hệ thống tạo một revision của review và gửi email thông báo tới toàn bộ participant.                                                                                                                                                                                                    | Video 6, 7 | Bắt buộc (Must) |

#### 6.6.2 Thực hiện Review (Reviewer / Approver)

| Mã        | Yêu cầu nghiệp vụ                                                                                                                                                                                                                                            | Nguồn         | Ưu tiên         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------- |
| BR-REV-10 | Người được mời nhận email do moderator gửi, bấm link trong email để mở trực tiếp review trong hệ thống.                                                                                                                                                      | Video 6       | Bắt buộc (Must) |
| BR-REV-11 | Giao diện Review Center gồm: cột điều hướng trái (Summary, Table of Contents, Search), thanh công cụ trên (Tools & Actions), và khung chính hiển thị danh sách item.                                                                                         | Video 6       | Bắt buộc (Must) |
| BR-REV-12 | Người dùng có thể bình luận tổng quát trên toàn bộ item, hoặc bôi chọn một đoạn nội dung cụ thể để bình luận chính xác vào đoạn đó; có thể đọc và trả lời bình luận của người khác.                                                                          | Video 6, 8    | Bắt buộc (Must) |
| BR-REV-13 | Mỗi bình luận có thể được gắn nhãn phân loại: General comment, Question, Proposed change, hoặc Issue.                                                                                                                                                        | Video 7, 8    | Bắt buộc (Must) |
| BR-REV-14 | Reviewer đánh dấu (checkbox) hoàn tất xem xét cho từng item hoặc đánh dấu cả trang là đã reviewed để ghi nhận tiến độ cá nhân.                                                                                                                               | Video 6, 8    | Bắt buộc (Must) |
| BR-REV-15 | Approver toggle Approve hoặc Reject cho từng item; ngoài ra có "Batch action — Mark entire page as approved/rejected" để duyệt/từ chối hàng loạt cả trang (khuyến nghị chỉ dùng khi việc rà soát đã thực hiện offline trước đó, để tránh "rubber-stamping"). | Video 6, 7, 8 | Bắt buộc (Must) |
| BR-REV-16 | Người dùng có thể @mention participant khác ngay trong bình luận để nhắc chú ý một item; người được mention nhận email kèm link trực tiếp tới item đó.                                                                                                       | Video 7       | Nên có (Should) |
| BR-REV-17 | Cho phép xem/preview file đính kèm (ví dụ Excel) trực tiếp trong giao diện review mà không cần rời màn hình.                                                                                                                                                 | Video 7       | Nên có (Should) |
| BR-REV-18 | Khi moderator publish version mới của một item, biểu tượng lịch (calendar icon) xuất hiện cạnh item đó; bấm vào để mở cửa sổ so sánh (redline/greenline) thể hiện thay đổi.                                                                                  | Video 6, 8    | Bắt buộc (Must) |
| BR-REV-19 | Cung cấp bộ lọc cho phép chỉ hiển thị các item cần review hoặc đã cập nhật kể từ version trước, giúp người dùng không phải rà soát lại toàn bộ nội dung đã xem.                                                                                              | Video 8       | Nên có (Should) |
| BR-REV-20 | Trang "Complete Review": khi đã đánh dấu hết mọi item, hiển thị thống kê tóm tắt (thời lượng đã dùng, số bình luận, số item approve/reject).                                                                                                                 | Video 7, 8    | Bắt buộc (Must) |
| BR-REV-21 | Nếu còn ít nhất một item bị reject, hệ thống chặn không cho ký điện tử và chỉ cho phép chọn "Request a new revision" thay vì hoàn tất review.                                                                                                                | Video 7, 8    | Bắt buộc (Must) |
| BR-REV-22 | Nếu tổ chức bật electronic signature: khi hoàn tất review, hệ thống yêu cầu người dùng re-authenticate (nhập lại username/password) và hiển thị vai trò/ý nghĩa của chữ ký (signer role & signature meaning) trước khi xác nhận.                             | Video 7, 8    | Nên có (Should) |
| BR-REV-23 | Trang chủ hiển thị nhanh các review đang hoạt động (active) mà người dùng cần xử lý, có thể bấm để mở trực tiếp.                                                                                                                                             | Video 7       | Nên có (Should) |
| BR-REV-24 | Mỗi khi moderator publish một version mới của review, toàn bộ trạng thái approve/reject/đã xem trước đó của các item bị xoá — participant bắt buộc phải vote/xem lại từ đầu trên nội dung mới.                                                               | Video 7, 8    | Bắt buộc (Must) |

#### 6.6.3 Điều phối Review (Moderator)

| Mã        | Yêu cầu nghiệp vụ                                                                                                                                                                                                | Nguồn          | Ưu tiên         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | --------------- |
| BR-REV-25 | Moderator có thể thêm/bớt moderator khác cho review đang mở.                                                                                                                                                     | Video 10       | Nên có (Should) |
| BR-REV-26 | Moderator có thể thêm participant mới vào review đang mở và chỉ định vai trò (Reviewer/Approver); participant mới nhận email thông báo.                                                                          | Video 10       | Nên có (Should) |
| BR-REV-27 | Stats tab > Participant Progress: xem tiến độ theo từng người tham gia — số item đã approve/reject (đối với Approver) hoặc số item đã finished/in progress (đối với Reviewer).                                   | Video 7, 9, 10 | Bắt buộc (Must) |
| BR-REV-28 | Stats tab > Item Progress: xem trạng thái duyệt/góp ý theo từng item, kèm số lượng bình luận/vote nếu tính năng này được bật.                                                                                    | Video 9, 10    | Bắt buộc (Must) |
| BR-REV-29 | Feedback tab: tổng hợp toàn bộ bình luận/feedback từ mọi participant tại một nơi duy nhất; moderator có thể lọc (ví dụ theo "proposed change"), @mention người liên quan, và trả lời trực tiếp từ đây.           | Video 7, 8, 10 | Bắt buộc (Must) |
| BR-REV-30 | Moderator có thể chỉnh sửa nội dung item ngay trong Single Item View (trong phạm vi review) để đáp ứng các "proposed change" từ approver; sau khi sửa, có thể Resolve kèm ghi chú (ví dụ "đã áp dụng thay đổi"). | Video 7, 10    | Bắt buộc (Must) |
| BR-REV-31 | Cơ chế "pending updates": các item đã được moderator chỉnh sửa nhưng participant chưa nhìn thấy được đếm số lượng, cho tới khi moderator Publish New Revision.                                                   | Video 7, 10    | Bắt buộc (Must) |
| BR-REV-32 | Publish New Revision: gửi email thông báo cho toàn bộ participant rằng có thay đổi cần xem lại; hỗ trợ so sánh (compare) hai version bất kỳ (ví dụ v8 với v3).                                                   | Video 7, 9, 10 | Bắt buộc (Must) |
| BR-REV-33 | Batch Transition workflow: chọn nhiều item cùng lúc và chuyển trạng thái hàng loạt (ví dụ từ "Review" sang "Accepted").                                                                                          | Video 9, 10    | Nên có (Should) |
| BR-REV-34 | Batch Edit: sửa một trường dữ liệu hàng loạt cho nhiều item (ví dụ "impacted discipline"), có thể kèm bình luận và gửi thông báo tới một nhóm hoặc người cụ thể.                                                 | Video 9        | Nên có (Should) |
| BR-REV-35 | "Close for Feedback": khoá review để ngăn approver/reviewer tiếp tục thêm bình luận/approve/reject, cho phép moderator thực hiện các tác vụ quản trị.                                                            | Video 9, 10    | Bắt buộc (Must) |
| BR-REV-36 | "Archive" / "Recover": lưu trữ review đã đóng, hoặc mở lại (recover) để tiếp tục thu thập feedback nếu cần.                                                                                                      | Video 9, 10    | Nên có (Should) |
| BR-REV-37 | Finalize Approval Review: khi mọi tác vụ quản trị hoàn tất, moderator có thể chốt (finalize) — đóng review và chốt baseline cuối cùng.                                                                           | Video 10       | Bắt buộc (Must) |

#### 6.6.4 Baseline & Báo cáo

| Mã        | Yêu cầu nghiệp vụ                                                                                                                                                        | Nguồn          | Ưu tiên          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------- |
| BR-REV-38 | Mỗi lần gửi nội dung vào review, hoặc mỗi lần publish version mới, hệ thống tự động tạo một Baseline (bản chụp/snapshot nội dung tại thời điểm đó).                      | Video 7, 9, 10 | Bắt buộc (Must)  |
| BR-REV-39 | Báo cáo "Review Center Stats Report": chọn một review cụ thể trong tham số báo cáo, chạy report để xuất toàn bộ số liệu feedback đã thu thập được.                       | Video 9        | Nên có (Should)  |
| BR-REV-40 | "Baseline – Compare to current": chọn baseline cần so sánh (ví dụ version 1), định dạng xuất, và tuỳ chọn bao gồm relationships/version comments trước khi chạy báo cáo. | Video 9        | Nên có (Should)  |
| BR-REV-41 | Báo cáo "Baseline Comparison Report": hiển thị chi tiết toàn bộ thay đổi giữa baseline được chọn và trạng thái hiện tại — phục vụ mục đích đối chiếu/audit.              | Video 9        | Cân nhắc (Could) |

---

## 7. Quy tắc nghiệp vụ tổng hợp (Business Rules)

Các quy tắc dưới đây mang tính xuyên suốt (cross-cutting), áp dụng cho nhiều module chức năng và cần được tuân thủ nghiêm ngặt trong thiết kế hệ thống:

| Mã    | Quy tắc                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QT-01 | Chỉ một người được chỉnh sửa một item tại một thời điểm; hệ thống khoá item đang được sửa để tránh ghi đè lẫn nhau.                                                                                     |
| QT-02 | Cờ "suspect" chỉ tự động gắn cho item ở đúng một cấp ngay bên dưới (downstream) item vừa thay đổi — không tự động lan xa hai cấp trở lên.                                                               |
| QT-03 | Quan hệ truy vết (relationship) có thể là bắt buộc (required) hoặc tuỳ chọn (optional), tuỳ theo quy tắc do Administrator thiết lập cho từng loại quan hệ.                                              |
| QT-04 | Reviewer chỉ có duy nhất một trạng thái "đã xem" (checkbox); Approver có hai lựa chọn Approve/Reject — hai vai trò không thể dùng chung một bộ trạng thái.                                              |
| QT-05 | Mỗi khi moderator publish một version mới của review, toàn bộ trạng thái approve/reject/đã xem trước đó của mọi item trong review bị xoá — participant phải xem/vote lại từ đầu trên nội dung mới nhất. |
| QT-06 | Không thể áp dụng chữ ký điện tử để hoàn tất review khi vẫn còn ít nhất một item ở trạng thái reject; hệ thống chỉ cho phép "Request a new revision" trong trường hợp này.                              |
| QT-07 | Template "Approval Review" do Administrator cấu hình và không thể chỉnh sửa lại khi khởi tạo review; template "Peer Review" có thiết lập tương tự nhưng cho phép moderator tuỳ chỉnh khi tạo.           |
| QT-08 | Người dùng với license Reviewer hạn chế không có quyền truy cập read-only vào dự án; ngữ cảnh (upstream/downstream) phải được đính kèm rõ ràng trong review để họ có đủ thông tin.                      |
| QT-09 | "Close for Feedback" phải được thực hiện trước khi moderator có thể thực hiện các thao tác quản trị hàng loạt (batch edit/transition) trên nội dung review.                                             |

---

## 8. Yêu cầu phi chức năng (Non-Functional Requirements)

Các yêu cầu dưới đây được suy ra từ cách vận hành của hệ thống trong 10 video và cần khách hàng xác nhận mức độ áp dụng cụ thể cho MVP:

| Nhóm                | Yêu cầu đề xuất                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nền tảng truy cập   | Ứng dụng web, chạy được trên các trình duyệt hiện đại phổ biến, không yêu cầu cài đặt phần mềm phía client.                                                                                     |
| Phân quyền          | Hệ thống phân quyền theo vai trò (Administrator, Project Member, Moderator, Approver, Reviewer) và theo loại license (đầy đủ vs. hạn chế), ảnh hưởng tới khả năng truy cập read-only vào dự án. |
| Thông báo           | Gửi email tự động cho các sự kiện: mời tham gia review, @mention, subscribe/thay đổi item, publish revision mới, thêm participant/moderator.                                                    |
| Lưu vết & Kiểm toán | Lưu lịch sử version đầy đủ cho mọi item; lưu baseline mỗi khi gửi review hoặc publish revision; hỗ trợ so sánh version bất kỳ (redline/greenline).                                              |
| Hiệu năng           | Chưa có chỉ tiêu cụ thể trong nội dung 10 video — cần khách hàng cung cấp kỳ vọng về số lượng item/dự án, số người dùng đồng thời cho MVP.                                                      |
| Khả năng mở rộng    | Kiến trúc cần cho phép bổ sung các module ngoài scope MVP (ví dụ tích hợp bên thứ ba, AI hỗ trợ viết yêu cầu) ở giai đoạn sau mà không phải thiết kế lại toàn bộ.                               |

---

## 9. Tiêu chí nghiệm thu MVP (Acceptance Criteria)

- Toàn bộ yêu cầu được đánh dấu "Bắt buộc (Must)" trong Chương 6 được xây dựng và có thể demo thành công theo đúng luồng nghiệp vụ mô tả.
- Khách hàng xác nhận bằng văn bản (email/biên bản họp) về phạm vi tại Chương 2 trước khi đội dự án chuyển sang giai đoạn thiết kế UI/UX.
- Toàn bộ câu hỏi mở tại Chương 10 được trả lời hoặc có quyết định tạm thời (kèm ghi chú rủi ro) trước khi chốt (baseline) tài liệu BRD phiên bản 1.0 chính thức.
- Một kịch bản kiểm thử nghiệm thu (UAT scenario) mô phỏng trọn vòng đời: tạo item → thiết lập quan hệ truy vết → gửi review → moderator xử lý & publish lại → hoàn tất review có chữ ký điện tử (nếu áp dụng) → xuất báo cáo baseline, chạy thành công không lỗi.

---

## 10. Câu hỏi mở & Rủi ro cần khách hàng xác nhận

| #   | Câu hỏi / Rủi ro cần xác nhận                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Module Test Management (Chương 6.4) có thực sự cần trong MVP giai đoạn 1, hay có thể dời sang giai đoạn 2 để tập trung nguồn lực cho luồng Item – Traceability – Review trước?                      |
| 2   | Chữ ký điện tử (electronic signature) trong MVP chỉ cần mô phỏng UI/UX hay phải đảm bảo giá trị pháp lý tương đương tiêu chuẩn ngành (ví dụ 21 CFR Part 11)?                                        |
| 3   | Cơ chế phân quyền theo loại license (Creator/Reviewer đầy đủ vs. Reviewer hạn chế) có cần triển khai đầy đủ như Jama Connect, hay MVP dùng mô hình phân quyền đơn giản hoá (ví dụ chỉ 2-3 vai trò)? |
| 4   | Tính năng import item từ file Word/Excel có bắt buộc trong MVP hay giai đoạn đầu chỉ cần nhập tay và reuse item có sẵn?                                                                             |
| 5   | Danh sách cụ thể các loại item cần hỗ trợ (ví dụ: Requirement, Use Case, Test Case, Defect, Epic...) và các trường dữ liệu tương ứng cho từng loại là gì?                                           |
| 6   | "Rolling review" dựa trên filter + workflow status — mức độ phức tạp của bộ lọc/workflow builder cần có trong MVP là gì, hay dùng bộ lọc/trạng thái mặc định dựng sẵn?                              |
| 7   | Hệ thống gửi email thật (SMTP tích hợp) hay chỉ cần mô phỏng/log thông báo trong phạm vi môi trường demo & UAT?                                                                                     |
| 8   | Có cần hỗ trợ đa dự án, đa tổ chức (multi-tenant) ngay từ MVP, hay MVP chỉ cần phục vụ một tổ chức/một bộ dữ liệu demo?                                                                             |

---

## Phụ lục A — Bảng ánh xạ Video nguồn → Module chức năng

| Video                                                | Module chức năng liên quan                               |
| ---------------------------------------------------- | -------------------------------------------------------- |
| 1. Introduction                                      | 6.1 Đăng nhập & Điều hướng; 6.2 Quản lý Item (khái niệm) |
| 2. Collaboration                                     | 6.3 Cộng tác (Stream)                                    |
| 3. Testing                                           | 6.4 Quản lý kiểm thử                                     |
| 4. Working with information                          | 6.2 Quản lý Item (CRUD, version, bulk update)            |
| 5. Traceability                                      | 6.5 Truy vết                                             |
| 6. Reviews (tổng quan)                               | 6.6.1, 6.6.2 Review Center (giới thiệu 3 vai trò)        |
| 7. Review Center - Overview                          | 6.6.1, 6.6.2, 6.6.3 Review Center (toàn bộ vòng đời)     |
| 8. Review Center - Providing Feedback                | 6.6.2 Thực hiện Review (Reviewer/Approver)               |
| 9. Review Center - Understanding Baselines and Stats | 6.6.3, 6.6.4 Điều phối & Baseline/Báo cáo                |
| 10. Review Center - Moderating a Review              | 6.6.3 Điều phối Review (Moderator)                       |

---

## Phụ lục B — Bảng thuật ngữ (Glossary)

| Thuật ngữ                                     | Giải thích                                                                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Item                                          | Đơn vị thông tin nhỏ nhất trong hệ thống (một yêu cầu, use case, test case, defect...), có thể thao tác/gửi review độc lập.          |
| Set / Folder                                  | Nhóm chứa các item, tổ chức theo cấu trúc cây trong Explorer.                                                                        |
| Explorer                                      | Giao diện cây thư mục cho phép truy cập toàn bộ cấu trúc của một dự án.                                                              |
| Stream                                        | Không gian thảo luận/bình luận gắn với item, dự án, hoặc toàn tổ chức.                                                               |
| Relationship (Upstream/Downstream)            | Quan hệ truy vết có hướng giữa hai item, thể hiện item nào phụ thuộc vào item nào.                                                   |
| Suspect flag                                  | Cờ cảnh báo tự động gắn lên item downstream khi item upstream liên quan vừa bị thay đổi, cần được rà soát lại.                       |
| Baseline                                      | Bản chụp (snapshot) nội dung tại một thời điểm cụ thể, dùng để so sánh/đối chiếu về sau.                                             |
| Review / Review Center                        | Không gian số hoá quy trình rà soát & phê duyệt nội dung, thay thế việc gửi tài liệu qua email.                                      |
| Moderator                                     | Người khởi tạo và điều phối một review: cấu hình, thêm participant, xử lý feedback, publish revision.                                |
| Reviewer                                      | Người tham gia rà soát nội dung, để lại bình luận, chỉ có trạng thái "đã xem".                                                       |
| Approver                                      | Người tham gia rà soát và có quyền Approve/Reject từng item, có thể cần ký điện tử.                                                  |
| Test case / Test plan / Test cycle / Test run | Đơn vị kiểm thử (bước kiểm tra) / nhóm test case kèm thông tin thực thi / một lượt lặp thực thi / một lần chạy cụ thể của test case. |
| Coverage / Test coverage                      | Mối liên kết thể hiện việc kiểm thử đã xác minh (verify) một yêu cầu cụ thể hay chưa.                                                |
| Impact Analysis                               | Báo cáo hiển thị toàn bộ item bị ảnh hưởng (upstream & downstream) khi một item thay đổi.                                            |
| Trace View                                    | Giao diện dạng lưới hiển thị toàn cảnh quan hệ truy vết giữa các item.                                                               |

---

## Ghi chú kiểm soát tài liệu (Document Control)

| Phiên bản | Ngày       | Mô tả thay đổi                                                                                        | Trạng thái                       |
| --------- | ---------- | ----------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1.0       | 05/09/2026 | Bản BRD đầu tiên, tổng hợp từ 10 video (transcript + kiểm kê màn hình v2.0), gửi khách hàng đánh giá. | Draft — chờ khách hàng phê duyệt |

> Tài liệu này là bản nháp phục vụ mục đích lấy ý kiến khách hàng. Sau khi các câu hỏi mở (Chương 10) được giải đáp và phạm vi (Chương 2) được xác nhận, tài liệu sẽ được cập nhật lên phiên bản chính thức làm cơ sở cho giai đoạn thiết kế & phát triển tiếp theo.
