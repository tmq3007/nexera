---
name: nexera-database
description: >-
  Use this skill when designing tables, writing SQL, or configuring Row Level Security (RLS)
  in Supabase (PostgreSQL) for the Nexera project.
---

# Nexera Database Management Skill

You are managing the Supabase (PostgreSQL) database for the Nexera platform.

## Core Principles
- **Platform:** Supabase (PostgreSQL).
- **Schema Design:** Normalize data appropriately for an E-commerce + CRM hybrid.
- **Security:** Row Level Security (RLS) is MANDATORY for all tables exposed to the public API (Next.js client).
- **RBAC:** Hệ thống phân quyền dựa trên Role-Based Access Control với bảng `roles`, `permissions`, `role_permissions`.

## Sơ đồ quan hệ thực thể (ERD)

```mermaid
erDiagram
    ROLES ||--|{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--|{ ROLE_PERMISSIONS : granted_to
    ROLES ||--o{ ADMIN_ACCOUNTS : assigned_to
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
    CATEGORIES ||--o{ PRODUCTS : categorizes

    ROLES {
        uuid id PK
        string name "UNIQUE: super_admin, editor, sales, ..."
        string display_name
        string description
        boolean is_system "Role mặc định không được xóa"
    }

    PERMISSIONS {
        uuid id PK
        string name "UNIQUE: products.read, orders.manage, ..."
        string display_name
        string module "products, orders, articles, admin, ..."
        string description
    }

    ROLE_PERMISSIONS {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }

    ADMIN_ACCOUNTS {
        uuid id PK
        uuid auth_user_id FK "auth.users(id) UNIQUE"
        string display_name
        uuid role_id FK "roles(id)"
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    CUSTOMERS {
        uuid id PK
        string full_name
        string email
        string phone
        string address
        string avatar_url
        uuid auth_user_id FK "Optional Supabase Auth ID"
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug
        string description
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string name
        string slug
        text description
        numeric price
        numeric import_price
        numeric discount_rate
        integer stock
        string type "EQUIPMENT or PACKAGE"
        string image_url
        string sku
        string brand
        string supplier
        string origin
        string warranty_info
        jsonb specifications
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        numeric total_amount
        string status "PENDING, PAID, SHIPPED, COMPLETED"
        string payment_method "PayOS"
        string payos_order_code
        text note
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        numeric unit_price
        numeric total_price
    }

    LEADS {
        uuid id PK
        string name
        string email
        string phone
        text message
        string status "NEW, CONTACTED, RESOLVED"
        timestamp created_at
    }

    ARTICLES {
        uuid id PK
        string title
        string slug
        text content
        string image_url
        string type "NEXERA default"
        timestamp published_at
    }

    PROJECTS {
        uuid id PK
        string name
        string category "INDUSTRIAL, RESIDENTIAL, SOLAR"
        text description
        string image_url
        date completion_date
    }
```

## Chi tiết các bảng (Tables Breakdown)

1. **RBAC (Role-Based Access Control):**
   - `roles`: Định nghĩa vai trò (`super_admin`, `editor`, `sales`, hoặc tự tạo thêm). Role có `is_system=true` không được xóa.
   - `permissions`: Quyền hạn chi tiết theo module. Naming convention: `module.action` (vd: `products.write`, `orders.manage`).
   - `role_permissions`: Bảng trung gian gắn quyền vào vai trò (Many-to-Many).
2. **Authentication & Accounts:**
   - `admin_accounts`: Tài khoản Admin, liên kết `auth.users` và `roles`. Có `is_active` để vô hiệu hóa mà không xóa.
   - `customers`: Thông tin khách hàng Storefront, dùng chung cho cả CRM.
3. **E-commerce:**
   - `categories`: Phân loại sản phẩm.
   - `products`: Thiết bị/gói lắp đặt (có `import_price`, `discount_rate`, `specifications` JSONB).
4. **Order Management:**
   - `orders`: Đơn hàng (`status`, `payos_order_code`, `note`).
   - `order_items`: Chi tiết từng sản phẩm trong đơn.
5. **CRM:**
   - `leads`: Dữ liệu Form Tư vấn.
6. **Content (CMS):**
   - `articles`: Tin tức, blog.
   - `projects`: Dự án tiêu biểu.

## Default Permissions Matrix

| Permission | super_admin | editor | sales |
|---|:---:|:---:|:---:|
| `dashboard.view` | ✅ | ✅ | ✅ |
| `products.read/write/delete` | ✅ | ✅ | read only |
| `categories.read/write/delete` | ✅ | ✅ | ❌ |
| `orders.read/manage` | ✅ | ❌ | ✅ |
| `customers.read/write` | ✅ | ❌ | ✅ |
| `leads.read/manage` | ✅ | ❌ | ✅ |
| `articles.read/write/delete` | ✅ | ✅ | ❌ |
| `projects.read/write/delete` | ✅ | ✅ | ❌ |
| `admin.manage_users/roles/settings` | ✅ | ❌ | ❌ |

## Helper Function

Dùng hàm `has_permission()` trong RLS hoặc application code:
```sql
-- Kiểm tra user hiện tại có quyền 'products.write' không
SELECT has_permission('products.write');
```

## Security Guidelines (RLS)
- **Public Read:** `products`, `articles`, `projects` — cho phép `SELECT` công khai.
- **Admin Write:** Dùng `has_permission()` để kiểm tra quyền trước khi cho `INSERT/UPDATE/DELETE`.
- **User Isolation:** Customer chỉ xem `orders` và `customers` record của mình.
- **Admin Isolation:** Chỉ `super_admin` quản lý `roles`, `permissions`, `admin_accounts`.

## Common Workflows
- **Writing Migrations:** Generate standard PostgreSQL `CREATE TABLE`. Dùng `UUID` PK, `TIMESTAMPTZ` dates.
- **Enabling Security:** Luôn `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` + `CREATE POLICY`.
- **Checking Admin Access:** `SELECT * FROM admin_accounts WHERE auth_user_id = auth.uid() AND is_active = true`.
- **Checking Permission:** `SELECT has_permission('module.action')`.
- **Adding New Permission:** INSERT vào `permissions`, rồi INSERT vào `role_permissions` để gắn cho role phù hợp.
