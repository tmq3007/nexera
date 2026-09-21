# Quy chuẩn Kiến trúc: Toàn bộ Chức năng Phải Thông Qua Backend API (Backend-First Architecture)

Quy chuẩn này là **BẮT BUỘC** áp dụng cho toàn bộ dự án Nexera (bao gồm Storefront, Admin Dashboard & CRM, Chat Widget, Thanh toán,...).

---

## 1. Nguyên Tắc Cốt Lõi (Core Architectural Principle)

- **Frontend KHÔNG truy vấn trực tiếp Cơ sở dữ liệu (Database)**:
  - ❌ **TUYỆT ĐỐI KHÔNG** dùng Supabase Client để gọi trực tiếp các lệnh dữ liệu trên Frontend:
    ```typescript
    // ❌ NGHIÊM CẤM TRÊN FRONTEND:
    supabase.from("customers").select("*")...
    supabase.from("conversations").insert({...})
    supabase.from("chat_messages").update({...})
    supabase.from("orders").select(...)
    ```
  - ✅ **BẮT BUỘC**: Mọi thao tác đọc/ghi dữ liệu (CRUD), xử lý nghiệp vụ, xác thực danh tính, tính toán, gộp dữ liệu PHẢI được đóng gói thành RESTful API / WebSocket trên **NestJS Backend** (`nexera-backend`).
  - Frontend chỉ đóng vai trò tầng giao diện (Presentation Layer), giao tiếp với hệ thống duy nhất qua HTTP Client (fetch / axios / service wrapper) gọi về `NEXT_PUBLIC_BACKEND_URL`.

---

## 2. Rationale & Tầm Nhìn Kiến Trúc (Tại Sao Phải Tuân Thủ?)

1. **Khả năng thay thế & Độc lập Cơ sở Dữ liệu (Database Agnostic)**:
   - Cơ sở dữ liệu trong tương lai có thể di chuyển từ Supabase sang PostgreSQL tự vận hành (Self-hosted), MySQL, Prisma, TypeORM, MongoDB,... 
   - Khi tách rời qua tầng Backend API, nếu thay đổi database hoặc ORM, **toàn bộ Frontend giữ nguyên 100% không cần sửa một dòng code nào**.
2. **Bảo vệ Nghiệp Vụ & An Toàn Bảo Mật (Centralized Business Logic & Security)**:
   - Không bị phụ thuộc vào Row Level Security (RLS) của Client. Tránh các lỗi permission 42501 hoặc hở schema dữ liệu nhạy cảm trên browser.
   - Toàn bộ validation, authorization, logging, audit trail được kiểm soát tập trung tại NestJS Backend (Guards, Interceptors, Pipes).
3. **Hiệu năng & Khả năng Mở rộng (Performance & Scalability)**:
   - Backend dễ dàng tích hợp Caching (Redis/Memory), Queues (BullMQ), Transaction an toàn, gộp truy vấn (Batching), kết nối Webhook bên thứ 3 (PayOS, GHN,...).

---

## 3. Quy Trình Phát Triển Tính Năng Mới (Development Workflow)

Khi triển khai bất kỳ màn hình hoặc chức năng mới nào:

1. **Bước 1: Thiết kế & Xây dựng API trên NestJS (`nexera-backend`)**:
   - Định nghĩa DTO rõ ràng với `class-validator` (Request Body, Query Params, Response DTO).
   - Viết Service xử lý nghiệp vụ, query DB thông qua Service layer của Backend.
   - Viết Controller phơi bày Endpoint (ví dụ: `GET /chat/messages`, `POST /chat/send`, `POST /customers/profile`,...).
2. **Bước 2: Tạo Service Client trên Next.js (`nexera-frontend`)**:
   - Viết module gọi API trong `src/services/` hoặc `src/lib/api/` (sử dụng fetch có type-safe).
3. **Bước 3: Gọi Service từ Component / React Query / SWR / Server Actions**:
   - Component chỉ nhận dữ liệu sạch từ Backend API, không chứa bất kỳ logic query DB nào.

---

## 4. Quy Định Về Realtime & Lắng Nghe Sự Kiện

- Với các tính năng yêu cầu Realtime tức thì (ví dụ: tin nhắn chat mới, trạng thái typing, thông báo đơn hàng):
  - Frontend chỉ dùng channel để nhận event thông báo (Broadcast / Event trigger).
  - Ngay khi nhận trigger sự kiện, nếu cần lấy danh sách hoặc cập nhật dữ liệu, Frontend gọi qua Backend API để đảm bảo tính nhất quán dữ liệu.

---

## 5. Chiến Lược Chuyển Đổi (Refactoring Existing Code)

- Mọi code hiện tại đang còn tồn tại lời gọi `supabase.from(...)` trên Frontend (bao gồm `NexeraChatWidget`, `LiveChatManager`, trang Admin, trang Đăng nhập) phải được dần tái cấu trúc đưa toàn bộ logic về `nexera-backend`.
- Khi sửa đổi hoặc mở rộng bất kỳ module nào, ưu tiên số 1 là chuyển đổi các lời gọi Supabase direct query còn sót lại sang Backend API tương ứng.
