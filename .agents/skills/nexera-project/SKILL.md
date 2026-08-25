---
name: nexera-project
description: >-
  Use this skill when you are working on the Nexera E-commerce and CRM project.
  It provides the core business context, the agreed-upon technical stack (Next.js, NestJS, Supabase),
  and the architectural guidelines for the project. Activate this skill whenever you need to
  write code, plan features, or understand the overall structure of the Nexera system.
---

# Nexera Project Manager Skill

You are working on the **Nexera Integrated Solutions Ecosystem** project. This project is a modern E-commerce and CRM platform.

## Core Technical Stack

Always adhere to the following technology stack when writing code or planning features:
- **Frontend (Storefront & Admin Dashboard):** Next.js (App Router), React, TypeScript, Tailwind CSS. The Admin Dashboard is integrated into the same repository under the `/admin` route.
- **Backend (Payment & Secure Logic):** Node.js with NestJS framework.
- **Database & Authentication:** Supabase (PostgreSQL) with Row Level Security (RLS).

## Project Guidelines

1. **Architecture Rule:** The Next.js frontend should fetch product and content data directly from Supabase to maximize speed. The NestJS backend should ONLY be used as a secure microservice to handle payment gateways (PayOS) and sensitive webhooks.
2. **Business Context:** Nexera positions itself as an "Integrated Solutions Ecosystem" focusing on Smart Technology and Green Energy. The UI/UX should reflect a premium, modern, and tech-forward aesthetic.
3. **Monolith Frontend:** The CRM and Admin dashboard are NOT a separate project. They share the Next.js codebase to reuse UI components and speed up development.
4. **Language Rule (BẮT BUỘC):** Toàn bộ giao diện website (Storefront & Admin) phải sử dụng **Tiếng Việt**. Bao gồm: nội dung trang, label, placeholder, button text, thông báo lỗi, metadata SEO (title, description). Chỉ dùng tiếng Anh cho: tên biến trong code, tên file, và các thuật ngữ kỹ thuật không có bản dịch phù hợp.
5. **Ministry of Industry and Trade (Bộ Công Thương) Compliance:** Toàn bộ Footer phải luôn hiển thị đầy đủ 5 chính sách (Bảo mật, Vận chuyển, Đổi trả, Thanh toán, Điều khoản) và Thông tin công ty (Tên công ty, MST, Địa chỉ, SĐT, Email). Code phải tuân thủ chuẩn `siteConfig.company` và `siteConfig.policies`.

## Authentication Architecture (2 Hệ thống riêng biệt)

Hệ thống xác thực được chia thành **2 phần hoàn toàn tách biệt**:

### A. Khách hàng (Storefront Authentication)
- **Bảng DB:** `customers` (có cột `auth_user_id` FK tới `auth.users`).
- **Đăng ký / Đăng nhập:** Tại `/dang-nhap`, `/dang-ky` (trang Storefront).
- **Cơ chế:** Dùng Supabase Auth (email/password hoặc OAuth).
- **Sau đăng nhập:** Tự động tạo/liên kết record trong bảng `customers`.
- **Quyền hạn:** Xem đơn hàng cá nhân, quản lý thông tin tài khoản, đặt hàng.

### B. Quản trị viên (Admin Authentication + RBAC)
- **Bảng DB:** `admin_accounts` (FK tới `auth.users` và `roles`), `roles`, `permissions`, `role_permissions`.
- **Đăng nhập:** Tại `/dang-nhap/admin` (trang riêng biệt, không nằm trong `/admin`).
- **Cơ chế:** Dùng Supabase Auth (email/password), sau đó middleware kiểm tra `auth.uid()` có tồn tại trong bảng `admin_accounts` VÀ `is_active = true` hay không.
- **Nếu không có record hoặc bị vô hiệu hóa:** Từ chối truy cập, redirect về `/dang-nhap/admin`.
- **Phân quyền RBAC:**
  - Mỗi admin được gắn 1 `role` (FK tới bảng `roles`).
  - Mỗi role có nhiều `permissions` (qua bảng trung gian `role_permissions`).
  - Role mặc định: `super_admin` (toàn quyền), `editor` (nội dung), `sales` (đơn hàng/leads).
  - Có thể tạo thêm role mới và gắn permissions tùy ý mà không cần sửa code.
  - Dùng hàm SQL `has_permission('module.action')` để kiểm tra quyền.

> **Lưu ý quan trọng:** Trang đăng nhập Admin nằm ở `/dang-nhap/admin`, KHÔNG phải `/admin/login`. Tất cả route `/admin/*` đều được bảo vệ bởi middleware.

## Brand Guidelines & Colors

Nexera uses a bright, professional, and tech-forward palette. Always use these exact hex codes or their CSS variables when building UI components:
- **Background / White:** `#ffffff` (`var(--background)`) - Used for primary backgrounds.
- **Foreground / Deep Blue:** `#13426e` (`var(--foreground)` or `var(--accent)`) - Used for main text, headings, dark backgrounds, and the footer.
- **Primary / Vibrant Green:** `#80bf49` (`var(--primary)`) - Used for primary buttons, highlighted text, badges, and accents.
- **Primary Light / Light Green:** `#9ad166` (`var(--primary-light)`) - Used for hover states on primary buttons.
- **Surface / Light Blue:** `#f0f7fb` (`var(--surface)`) - Used for alternate section backgrounds and card backgrounds to break up white space.
- **Border / Light Blue-Gray:** `#d4e6f1` (`var(--border)`) - Used for dividers and borders.

Avoid using default dark mode or pure black (`#000000`). Stick strictly to the blue, green, and white theme.

## Execution Phases (Priorities)

Always prioritize tasks according to this execution order unless instructed otherwise:
1. **Phase 1 (Setup - DONE):** Initialize Next.js, NestJS, and Supabase projects.
2. **Phase 2 (Customer Storefront - DONE):** Build the public-facing UI first (Home, About, Products, News, Contact Form) to establish the brand aesthetic.
3. **Phase 3 (Database - DONE):** Create Supabase schemas for Products, Orders, Leads, and Content. Enable RLS policies.
4. **Phase 4 (Admin/CRM UI - DONE):** Build the `/admin` dashboard for managing products, leads, and orders.
5. **Phase 5a (Admin Auth - IN PROGRESS):** Tạo bảng `admin_accounts`, middleware kiểm tra role, bảo vệ `/admin` routes. Login tại `/dang-nhap/admin`.
6. **Phase 5b (Customer Auth):** Tạo trang đăng ký/đăng nhập Storefront (`/dang-nhap`, `/dang-ky`), liên kết với bảng `customers`.
7. **Phase 6 (Backend & PayOS - LAST):** Integrate Cart state (Zustand), setup NestJS microservice, configure PayOS webhooks, and integrate payment checkout flow.

## Reference Materials

Before making major architectural decisions, always refer to these core documents:

1. **Implementation Plan & SRS:** Detailed system features, user requirements, and technical breakdown.
   [implementation_plan.md](../../../docs/implementation_plan.md)
   
2. **Business Profile (Hồ sơ Năng lực):** The company's vision, core values, and branding details. Use this to understand the context of the content being displayed.
   [NEXERA HoSoGioiThieu DayDu.md](../../../docs/NEXERA%20HoSoGioiThieu%20DayDu.md)

## Skill Routing (Bắt buộc)

As the master project skill, you MUST activate or read the following specialized skills based on the task:
- **For Frontend tasks (Next.js, UI, Tailwind):** You must refer to the `nexera-frontend` skill (`.agents/skills/nexera-frontend/SKILL.md`).
- **For Backend tasks (NestJS, PayOS, APIs):** You must refer to the `nexera-backend` skill (`.agents/skills/nexera-backend/SKILL.md`).
- **For Database tasks (Supabase, PostgreSQL, RLS):** You must refer to the `nexera-database` skill (`.agents/skills/nexera-database/SKILL.md`), which contains the full ERD and schema.

## Common Workflows

- **When asked to build a UI component:** Activate `nexera-frontend`. Default to Tailwind CSS and ensure it aligns with the Nexera "Smart Technology" branding.
- **When asked to design a database table:** Activate `nexera-database`. Write Supabase SQL scripts and enable RLS policies immediately.
- **When asked to handle payments:** Activate `nexera-backend`. Write NestJS modules and controllers, not Next.js API routes.
