---
name: nexera-chat
description: >-
  Kỹ năng mô tả kiến trúc và luồng xử lý tính năng Live Chat của Nexera, đặc biệt tập trung 
  vào cơ chế Gộp lịch sử (Merge Session) khi Khách vãng lai (Guest) đăng nhập thành tài khoản chính thức.
---

# Nexera Chat & Consultation Logic (Method C)

Tính năng Chat Tư vấn trên Nexera hoạt động dựa trên mô hình **"Gộp thông minh" (Merge Logic)** chuẩn E-commerce (giống Intercom, Zendesk), cho phép trải nghiệm không ngắt quãng giữa việc Chưa đăng nhập và Đã đăng nhập.

## 1. Nguyên lý cơ bản

- **Guest (Khách vãng lai):** Sử dụng một mã ngẫu nhiên sinh từ frontend (ví dụ: `guest_abc123`) lưu trong `localStorage` với key `nexera_chat_guest_session`. 
- **Customer (Khách đã đăng nhập):** Sử dụng `customer_id` thật từ database.
- TẤT CẢ giao diện chat diễn ra trong **Khung Chat Widget** duy nhất (`NexeraChatWidget.tsx`).

## 2. Bảng Database (Supabase)

Bảng `conversations`:
- `id` (uuid)
- `customer_id` (uuid) - NULL nếu là Guest
- `guest_session_id` (text) - ID tạm thời
- `status` (text) - 'OPEN', 'RESOLVED', 'CLOSED', hoặc **'MERGED'** (khi hội thoại Guest đã được gộp vào tài khoản chính thức và trở thành hội thoại phụ).

## 3. Trải nghiệm người dùng (Luồng frontend)

1. Mở trang: Frontend kiểm tra `localStorage`. Nếu chưa có `guest_session`, tự tạo một cái.
2. Chat: 
   - Nếu chưa đăng nhập: Gọi Supabase lấy hội thoại có `guest_session_id = ...`.
   - Nếu đã đăng nhập: Lấy hội thoại có `customer_id = ...`.
3. Yêu cầu nhập SĐT: Form xin "Tên + SĐT" chỉ hiện cho Guest để lấy lead. Đã đăng nhập thì ẩn.

## 4. Cơ chế Gộp lịch sử (Merge Logic)

Đây là điểm mấu chốt. Khi người dùng **Đăng ký** hoặc **Đăng nhập** thành công, hệ thống (frontend hoặc backend) phải thực hiện các bước sau:

1. Lấy `guest_session` từ `localStorage`.
2. Kiểm tra xem có hội thoại nào thuộc `guest_session` này mà chưa có `customer_id` không.
3. Nếu khách hàng (Customer) hiện tại **đã có** một hội thoại cũ (hội thoại A), và hội thoại Guest vừa chat cũng đang mở (hội thoại B).
   - Tối ưu: Đổi trạng thái hội thoại B thành `MERGED`. Update toàn bộ tin nhắn của B (`chat_messages`) trỏ sang `conversation_id = A`.
   - Hoặc đơn giản: Trỏ `customer_id` của hội thoại Guest thành ID của User mới đăng nhập.
4. Xóa `localStorage` chứa thông tin form xin SĐT rác nếu cần, hoặc đồng bộ SĐT/Tên vừa nhập vào DB `customers`.

*(Skill này dùng để tham chiếu khi sửa đổi các luồng Auth và Chat trong dự án Nexera).*
