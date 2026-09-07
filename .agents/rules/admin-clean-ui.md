# Quy chuẩn Thiết kế Giao diện: Tối giản & Loại bỏ Icon Dư thừa (Clean & Minimalist UI)

Quy chuẩn này bắt buộc áp dụng cho toàn bộ giao diện Quản trị (Admin Dashboard & CRM) và các tiện ích tương tác (Chat Widget) của dự án Nexera.

## 1. Nguyên tắc Không Lạm Dụng Icon (No Icon Clutter)
- **Chỉ sử dụng icon ở nơi thực sự cần thiết**:
  - Thanh điều hướng chính (AdminSidebar) để người dùng dễ định hướng module.
  - Các nút thao tác dạng icon-only (ví dụ: nút Đóng `X`, nút Xóa thùng rác `Trash2`, nút Kính lúp `Search`, nút Xem chi tiết `Eye`).
- **Tuyệt đối KHÔNG gắn icon trang trí trước văn bản/nhãn**:
  - ❌ KHÔNG dùng icon 📞 trước "Số điện thoại" hoặc "SĐT".
  - ❌ KHÔNG dùng icon ✉️ trước "Email".
  - ❌ KHÔNG dùng icon 📝 hoặc 📄 trước "Ghi chú".
  - ❌ KHÔNG dùng icon 📦 trước "Đơn hàng".
  - ❌ KHÔNG dùng icon ✨ trước "Mẫu trả lời" hoặc tin nhắn tự động.
  - ❌ KHÔNG dùng icon 👑 hoặc ⭐ trước các nhãn "VIP" hay "Số chính".
  - ❌ KHÔNG dùng icon 🛡️ trước nhãn "Thành viên chính thức" hay màn hình thông báo.
  - ❌ KHÔNG dùng icon ❓ hay 💡 trước các nhãn "Gợi ý câu hỏi nhanh".
  - ❌ KHÔNG dùng emoji trang trí (⚡, 🔋, 🛠️, 📦) trong danh sách câu hỏi nhanh.

## 2. Bỏ Viền Nền Pill Màu Mè (No Heavy Pill Backgrounds)
- Trạng thái (Status, Tier, Phân hạng) hiển thị dạng văn bản tinh gọn với màu sắc chữ trực quan:
  - Chuẩn: `<span className="text-xs font-semibold text-emerald-600">Đang mở</span>`
  - ❌ Tránh: `<span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full">...</span>`
- Giữ giao diện thoáng đãng, phân cấp thị giác bằng kích thước chữ, độ đậm (`font-semibold`, `font-bold`), và màu sắc (`text-gray-900`, `text-gray-500`, `text-emerald-600`, `text-blue-600`, `text-purple-700`).

## 3. Tab Điều Hướng & Trạng Thái Rỗng (Clean Tabs & Empty States)
- Tab điều hướng trong modal hoặc trang quản lý: dùng text thuần túy gạch chân (`border-b-2 border-[#13426e]`), không gắn icon trang trí kèm text tab.
- Trạng thái rỗng (Empty state): hiển thị thông báo văn bản ngắn gọn, thân thiện; không chèn icon khổ lớn (như `<Users className="w-10 h-10" />` hay `<ShieldCheck className="w-12 h-12" />`).

## 4. Tối Giản Cấu Trúc Khối & Thẻ (Flat & Lightweight Layout)
- Tránh bọc quá nhiều lớp card viền (`border bg-gray-50 rounded-2xl`) lồng ghép nhau.
- Tập trung vào nội dung thông tin, dữ liệu text rõ ràng, dễ đọc, khoảng cách (padding/margin) cân đối.

## 5. Storefront Chat Widget (NexeraChatWidget)
Quy chuẩn áp dụng cho thanh chat tư vấn trên trang Storefront khách hàng.

- **Header**: Chỉ giữ logo NX, tên "Tư vấn viên NEXERA", trạng thái Online, nút cập nhật SĐT (icon Phone), và nút đóng (icon X). Không thêm icon trang trí khác.
- **Tin nhắn**: Bubble chat đơn giản, không gắn emoji hay icon trước nội dung tin nhắn. Tên người gửi hiển thị bằng text thuần túy.
- **Gợi ý câu hỏi nhanh**: Hiển thị dạng nút text thuần, không chèn emoji (⚡, 🔋, 📦) trước nội dung gợi ý.
- **Thanh nhập liệu**: Chỉ có ô input và nút gửi (icon Send). Không thêm icon trang trí dư thừa.
- **Form liên hệ**: Tiêu đề text thuần túy, không gắn icon trước label "Họ và tên", "Số điện thoại", "Email".
- **Thanh nhắc "Để lại SĐT"**: Text link đơn giản, không dùng icon Phone/Mail kèm theo.
