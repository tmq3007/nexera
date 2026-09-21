---
name: nexera-frontend
description: >-
  Use this skill when developing or modifying the Next.js frontend for the Nexera project.
  This applies to both the customer Storefront and the integrated Admin/CRM dashboard.
---

# Nexera Frontend Development Skill

You are working on the Frontend of the Nexera E-commerce and CRM platform.

## Core Technologies
- **Framework:** Next.js (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS + Vanilla CSS for custom micro-animations.
- **State Management:** Zustand or React Context API (for shopping cart state).
- **Data Fetching:** Toàn bộ dữ liệu được giao tiếp qua REST API của NestJS Backend (`nexera-backend`). TUYỆT ĐỐI KHÔNG truy vấn trực tiếp bảng dữ liệu bằng Supabase Client từ frontend.

## Architecture Rules
1. **Monorepo Approach:** Both the Customer Storefront and the Admin Dashboard are in the same Next.js codebase.
   - Admin routes must be grouped under `app/admin/` or `app/(admin)/`.
   - Storefront routes should be placed in `app/(storefront)/` or the root `app/`.
2. **Styling Guidelines:** 
   - Apply a "Smart Technology" and "Green Energy" aesthetic (glassmorphism, clean typography like Inter/Outfit).
   - Use Tailwind CSS by default, but do not hesitate to write custom CSS classes for complex animations.
3. **Language Rule (BẮT BUỘC):** 
   - ALL UI text MUST be in **Vietnamese (Tiếng Việt)**. This includes: page content, button labels, placeholders, error messages, navigation menus, footer text, and SEO metadata (`<title>`, `<meta description>`).
   - Set `<html lang="vi">` in the root layout.
   - Use Vietnamese date/currency formatting (`vi-VN` locale, VND currency).
4. **Data Flow & Backend-First Architecture (BẮT BUỘC):** 
   - Mọi chức năng đọc/ghi dữ liệu (sản phẩm, bài viết, khách hàng, CRM, tin nhắn chat, đơn hàng,...) PHẢI gọi qua API của NestJS Backend.
   - KHÔNG gọi trực tiếp `supabase.from('...')` trên frontend để bảo đảm tính độc lập với cơ sở dữ liệu (Database Agnostic), phục vụ cho khả năng thay đổi hoặc di chuyển DB trong tương lai. Chi tiết xem tại rule [backend-api-architecture.md](file:///d:/Document/_Projects/Nexera/.agents/rules/backend-api-architecture.md).

## Common Workflows
- **Building a Page:** Leverage Next.js Server Components (SSR/SSG) for SEO-heavy pages (like news and products). Use Client Components only when interactivity (like the shopping cart) is required.
- **Authentication:** Use Supabase Auth helpers to protect the `/admin` routes.
