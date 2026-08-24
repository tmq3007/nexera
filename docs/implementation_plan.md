# Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) - Hệ thống E-commerce Nexera

Tài liệu này mô tả chi tiết các yêu cầu kỹ thuật và nghiệp vụ cho dự án **Nền tảng Thương mại Điện tử và Quản trị Nexera**, được tham khảo cấu trúc chức năng thực tế từ hệ thống Manfusi.com.

## 1. Giới thiệu (Introduction)

### 1.1 Mục đích (Purpose)
Dự án nhằm xây dựng một nền tảng web hiện đại phục vụ việc giới thiệu giải pháp công nghệ, năng lượng xanh (lấy cảm hứng từ Manfusi), đồng thời cho phép khách hàng mua sắm thiết bị trực tuyến (tích hợp giỏ hàng, thanh toán điện tử). Hệ thống cũng cung cấp một module CRM và Quản trị mạnh mẽ được tích hợp trực tiếp vào trong nền tảng.

### 1.2 Phạm vi (Scope)
Sản phẩm là một hệ thống web nguyên khối (Monolith Frontend) bao gồm 2 phân hệ chạy chung trên một mã nguồn (Next.js):
- **Customer Storefront:** Giao diện website chính dành cho khách hàng.
- **Admin & CRM Dashboard (Route `/admin`):** Khu vực quản trị nội bộ dành cho nhân viên Nexera, được bảo vệ bằng xác thực (Authentication).

---

## 2. Mô tả Tổng quan (Overall Description)

### 2.1 Môi trường Công nghệ (Operating Environment & Tech Stack)
- **Frontend (Tích hợp cả Storefront & Admin):** Next.js (App Router), React, TypeScript, Tailwind CSS.
- **Backend (Payment Microservice):** Node.js kết hợp NestJS Framework.
- **Database & Authentication:** Supabase (PostgreSQL), tích hợp Row Level Security (RLS).
- **Hosting/Deployment:** Vercel (Next.js), Render/VPS (NestJS), Supabase Cloud. (Tên miền chính thức sẽ được tích hợp ở giai đoạn cuối).

---

## 3. Yêu cầu Chức năng Hệ thống (System Features)

### 3.1 Phân hệ Khách hàng (Customer Storefront)
*Tham khảo chi tiết từ cấu trúc trang Manfusi.com*

- **SF-01 (Introduction & About):** Trang Giới thiệu chi tiết về công ty. Bao gồm các chuyên mục:
  - Về chúng tôi (Sứ mệnh, Tầm nhìn Nexera).
  - Thành tựu & Chứng nhận.
  - Đối tác chiến lược.
- **SF-02 (Catalog & Products):** Trang Danh mục sản phẩm & Dịch vụ:
  - Hiển thị danh sách Thiết bị & Vật tư, Các Gói lắp đặt trọn gói.
  - Hỗ trợ chức năng tìm kiếm, bộ lọc (filter) theo giá, công suất.
- **SF-03 (Projects Portfolio):** Trang Dự án tiêu biểu, chia theo danh mục (Dự án Công nghiệp, Dự án Dân dụng, Ứng dụng điện mặt trời).
- **SF-04 (Media & News):** Trang Truyền thông và Blog:
  - Tin tức công ty, Tin tức năng lượng.
  - Kiến thức & Kinh nghiệm hay.
  - Bài báo truyền thông.
- **SF-05 (Contact & Lead Form):** Trang Liên hệ & Form đăng ký nhận tư vấn. Dữ liệu từ Form sẽ đổ thẳng về hệ thống CRM cho nhân viên Sale xử lý.
- **SF-06 (Cart & Checkout):** Giỏ hàng thông minh và tính năng Thanh toán. Cho phép khách hàng điền thông tin và chuyển hướng đến cổng thanh toán PayOS (VietQR).

### 3.2 Phân hệ Quản trị & CRM (Admin Dashboard)
*Được tích hợp chung vào mã nguồn Next.js tại thư mục `/admin`*

- **AD-01 (Product & Content Management):** CRUD (Thêm/Sửa/Xóa) dữ liệu cho Sản phẩm (giá bán, tồn kho), Dự án, và các Bài viết tin tức (Blog).
- **AD-02 (Order Management):** Theo dõi và thay đổi trạng thái đơn hàng (Chờ xử lý, Đã thanh toán, Đang vận chuyển, Hoàn thành).
- **AD-03 (CRM - Customer Relationship Management):** 
  - Lưu trữ Hồ sơ khách hàng và các Yêu cầu tư vấn (Leads) từ Form liên hệ (SF-05).
  - Theo dõi lịch sử giao dịch.
- **AD-04 (Revenue Analytics):** Biểu đồ thống kê doanh thu, tỷ lệ chuyển đổi, sản phẩm bán chạy.

### 3.3 Yêu cầu Giao tiếp Hệ thống (External Interfaces & APIs)
- **API-01 (Payment Gateway):** NestJS Backend giao tiếp với API của PayOS.
- **API-02 (Webhook):** NestJS xử lý Webhook trả về từ cổng thanh toán, đối soát chữ ký số (Checksum) rồi tự động gọi API cập nhật trạng thái đơn hàng lên Supabase.

---

## 4. Yêu cầu Phi chức năng (Non-Functional Requirements)

- **NFR-01 (Hiệu năng):** Storefront tận dụng SSR/SSG của Next.js, tốc độ tải trang cực nhanh để tối ưu SEO cho các bài viết truyền thông.
- **NFR-02 (Bảo mật):** 
  - Module Admin (`/admin`) phải bị chặn bằng Supabase Auth (Chỉ nhân viên có quyền mới vào được).
  - Mọi logic giá trị giao dịch phải xác thực ở NestJS Backend.
- **NFR-03 (Giao diện):** Responsive 100%, phong cách "Smart Technology".

---

## User Review Required

> [!IMPORTANT]
> Tôi đã cập nhật Kế hoạch theo sát các góp ý của bạn:
> 1. Toàn bộ tính năng (Bài viết giới thiệu, Tin tức, Dự án, Form tư vấn) của Manfusi đã được thiết kế lại thành các chức năng cụ thể (SF-01 đến SF-05).
> 2. Phân hệ Admin Dashboard (Quản lý) sẽ được **"dùng chung"** trên một bộ mã nguồn Next.js để phát triển siêu tốc độ.
>
> Vui lòng kiểm tra lại lần cuối. Nếu bạn thấy mọi thứ đã hoàn hảo, hãy phản hồi **"Bắt đầu code"** để tôi cập nhật bảng `task.md` và thực thi các lệnh khởi tạo dự án!
