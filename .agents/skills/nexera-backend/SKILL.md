---
name: nexera-backend
description: >-
  Use this skill when developing or modifying the NestJS backend for the Nexera project.
  This covers payment gateways (PayOS), sensitive logic, and webhooks.
---

# Nexera Backend Development Skill

You are working on the Backend Microservice of the Nexera platform.

## Core Technologies
- **Framework:** NestJS (built on Node.js).
- **Language:** TypeScript.
- **Primary Function:** Là Core Backend API Server cung cấp toàn bộ RESTful APIs cho hệ sinh thái Nexera (CRUD Sản phẩm, Đơn hàng, Khách hàng & CRM, Live Chat, Quản lý phiên hội thoại, Cổng thanh toán PayOS và Webhook). Đóng vai trò là lớp trừu tượng hóa cơ sở dữ liệu (Database Agnostic Layer), đảm bảo frontend hoàn toàn độc lập với DB.

## Architecture Rules
1. **Backend-First API Service:** NestJS backend chịu trách nhiệm toàn bộ về logic nghiệp vụ, xác thực, phân quyền và thao tác dữ liệu. Mọi tương tác dữ liệu từ Next.js frontend PHẢI đi qua các API endpoint của Backend thay vì truy vấn trực tiếp DB. Chi tiết xem tại rule [backend-api-architecture.md](file:///d:/Document/_Projects/Nexera/.agents/rules/backend-api-architecture.md).
2. **Database Access & Abstraction:** Backend kết nối cơ sở dữ liệu (PostgreSQL/Supabase hiện tại, hoặc các DB khác trong tương lai) thông qua Service layer tập trung. Backend có toàn quyền thực thi các giao tác nghiệp vụ an toàn.
3. **Payment Security:**
   - Always verify the signature of incoming webhooks from PayOS using HMAC SHA256 (or their provided library).
   - Never trust pricing data sent from the frontend. Always re-calculate the order total by querying the database before creating a payment session.

## Common Workflows
- **Generating a Module:** Use the NestJS CLI (`nest g module <name>`, `nest g controller <name>`, `nest g service <name>`).
- **Payment Flow:** 
  1. Receive checkout request from Frontend.
  2. Validate cart and calculate total.
  3. Generate PayOS Checkout URL (VietQR) and return to Frontend.
  4. Await Webhook confirmation, verify signature, and update the Order status in Supabase.

## File Storage & Upload Strategy (Images)
Images for Products, Articles, Projects, etc., must be uploaded rather than using plain external URLs.

**Storage Location Analysis (Optimizing for Free Tier):**
While Supabase Storage is convenient since it is built-in, its Free Tier is quite limited (1GB Storage, 2GB Bandwidth/month). For an e-commerce platform that might have many product images, this can quickly be exhausted.

Therefore, the recommended solution for image storage on a free tier is **Cloudinary**.
- **Cloudinary Free Tier:** Provides 25 monthly credits (1 credit = 1GB Storage OR 1GB Bandwidth OR 1000 Transformations). This is extremely generous for a startup/MVP.
- **Benefits:** Built-in CDN, automatic format optimization (serving WebP/AVIF), and on-the-fly resizing.

**Upload Workflow Strategy (Cloudinary):**
1. **Unsigned Direct Upload (Frontend - MVP Phase):** 
   - The Next.js Frontend uses a Cloudinary Unsigned Upload Preset to upload images directly from the browser to Cloudinary.
   - *Pros:* Very fast to implement, zero backend code required, saves backend bandwidth.
   - *Cons:* Slightly less secure as anyone with the preset name can upload images to your Cloudinary account (though Cloudinary allows restricting upload origins and file sizes).
2. **Signed Upload via Backend (Production Phase):**
   - The Frontend requests a "Signed Signature" from the NestJS Backend.
   - The NestJS Backend generates a signature using the Cloudinary API Secret.
   - The Frontend uses this signature to upload directly to Cloudinary safely.
   - *Pros:* Fully secure, still saves backend bandwidth since the heavy file doesn't pass through the backend.

**Decision for Nexera:**
- Update the system to use **Cloudinary** for all image hosting to save costs and leverage their generous free tier.
- The `ImageUpload.tsx` component in Next.js should be configured to upload directly to Cloudinary (using an Unsigned preset initially for speed of development).
