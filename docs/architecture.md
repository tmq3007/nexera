# Kiến trúc Hệ thống & Luồng Dữ liệu Nexera

Tài liệu này giải thích chi tiết cấu trúc thư mục của toàn bộ dự án và cách thức giao tiếp, bảo mật giữa Frontend (Next.js), Backend (NestJS) và Database (Supabase).

## 1. Cấu trúc Thư mục (Folder Structure)

Dự án sẽ được chia làm 2 thư mục chính độc lập, chạy trên 2 cổng (port) khác nhau khi code:

```text
D:\Document\_Projects\Nexera\
│
├── nexera-frontend/               (Dự án Next.js - Port 3000)
│   ├── app/
│   │   ├── (storefront)/          # Các trang khách hàng: /, /products, /news, /checkout
│   │   ├── (admin)/               # Các trang CRM/Admin: /admin/dashboard, /admin/products
│   │   ├── layout.tsx             # Giao diện chung
│   │   └── globals.css            # Tailwind & Vanilla CSS
│   ├── components/                # UI Components (Nút bấm, Card, Giỏ hàng)
│   ├── lib/                       
│   │   ├── supabaseClient.ts      # File cấu hình kết nối Supabase
│   │   └── store.ts               # Zustand: Quản lý State giỏ hàng
│   └── public/                    # Hình ảnh, font chữ
│
├── nexera-backend/                (Dự án NestJS - Port 4000)
│   ├── src/
│   │   ├── payment/               # Module xử lý gọi API PayOS
│   │   ├── webhook/               # Module lắng nghe thông báo thanh toán
│   │   ├── order/                 # Module xác thực đơn hàng an toàn
│   │   └── main.ts                # File khởi chạy Server
│   ├── prisma/                    # Cấu hình Prisma ORM (kết nối Supabase)
│   └── .env                       # Chứa khóa bảo mật (PayOS Client Key, Supabase Service Key)
│
└── docs/                          # Thư mục chứa tài liệu SRS, Kế hoạch
```

---

## 2. FE gọi BE như thế nào? Cái gì cần bảo mật?

Luật thiết kế của hệ thống này là **"Tách bạch Dữ liệu Công khai và Logic Bảo mật"**.

### Trường hợp 1: Dữ liệu Công khai (Không cần qua Backend)
Để website đạt tốc độ nhanh nhất (chuẩn SEO), Frontend (Next.js) sẽ **kết nối thẳng tới Database (Supabase)** bằng SDK.
- **Dữ liệu:** Danh sách Sản phẩm, Chi tiết Dự án, Tin tức Blog.
- **Luồng đi:** `Next.js` ➡️ `Supabase Database`.
- **Bảo mật:** Supabase có cơ chế Row Level Security (RLS) cho phép public chỉ được phép ĐỌC (Select) dữ liệu này, không được Sửa/Xóa.

### Trường hợp 2: Giao dịch & Bảo mật (Bắt buộc qua NestJS Backend)
Bất kỳ thao tác nào liên quan đến **Tiền bạc, Giá cả, Trạng thái đơn hàng** đều phải đi qua NestJS. Bạn **tuyệt đối không được** tính tổng tiền ở Frontend (Next.js) vì hacker có thể dùng trình duyệt sửa giá một tấm pin năng lượng mặt trời từ 5.000.000đ xuống còn 1đ.

**Luồng thanh toán an toàn sẽ diễn ra như sau:**
1. **Khách hàng đặt hàng:** Khách chọn 2 sản phẩm A và ấn "Thanh toán".
2. **FE gọi BE (API Call):** Frontend gửi 1 request REST API (qua thư viện Axios/Fetch) sang NestJS Backend. Nội dung gửi đi **chỉ bao gồm ID sản phẩm và Số lượng**, tuyệt đối không gửi Tổng tiền.
   *(Ví dụ: `POST http://localhost:4000/order/checkout` kèm Body: `[{id: 1, qty: 2}]`)*
3. **BE Xác thực (NestJS):** 
   - Backend nhận request, âm thầm lấy ID đó query vào Supabase bằng quyền Admin ẩn (Service Role Key) để check giá thực tế của sản phẩm A.
   - Backend tự nhân đơn giá với số lượng = Tổng tiền thực tế.
4. **BE gọi Cổng Thanh toán:** NestJS cầm Tổng tiền đó, mã hóa checksum và gửi yêu cầu tạo Link thanh toán (VietQR) cho PayOS.
5. **Trả kết quả:** NestJS trả Link PayOS về cho Frontend, Frontend tự động chuyển hướng khách sang PayOS.
6. **Webhook (Xác nhận ngầm):** Khi khách thanh toán xong, PayOS sẽ gọi ngầm một API Webhook về thẳng NestJS (`POST http://localhost:4000/webhook/payos`). NestJS kiểm tra chữ ký điện tử an toàn ➡️ Cập nhật trạng thái "Đã thanh toán" lên Supabase Database.

---

> [!TIP]
> **Tóm lại:** Frontend (Next.js) dùng để vẽ giao diện thật đẹp, thật mượt và kéo các thông tin cơ bản từ Database ra. Còn Backend (NestJS) đóng vai trò như một Kế toán viên vô hình, đứng ở giữa để bảo vệ tiền, tính toán giá trị giỏ hàng và cấp phép cho cổng thanh toán.
