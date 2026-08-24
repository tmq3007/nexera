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

## Sơ đồ quan hệ thực thể (ERD)

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : included_in
    CATEGORIES ||--o{ PRODUCTS : categorizes
    
    CUSTOMERS {
        uuid id PK
        string full_name
        string email
        string phone
        string address
        uuid auth_user_id FK "Optional Supabase Auth ID"
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string name
        string slug
        text description
        numeric price
        integer stock
        string type "EQUIPMENT or PACKAGE"
        string image_url
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        numeric total_amount
        string status "PENDING, PAID, SHIPPED, COMPLETED"
        string payment_method "PayOS"
        string payos_order_code "Mã đối soát VietQR"
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        numeric unit_price
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

1. **E-commerce:**
   - `categories`: Phân loại sản phẩm (Tấm pin, Biến tần...).
   - `products`: Thông tin thiết bị/gói lắp đặt (có cột `type`).
2. **Order Management:**
   - `orders`: Đơn hàng tổng quát (`status`, `payos_order_code`).
   - `order_items`: Chi tiết mua sản phẩm nào, giá bao nhiêu.
3. **CRM:**
   - `customers`: Thông tin khách mua.
   - `leads`: Hứng dữ liệu Form Tư vấn cho Sale.
4. **Content (CMS):**
   - `articles`: Tin tức, blog.
   - `projects`: Dự án tiêu biểu.


## Security Guidelines (RLS)
- **Public Read Access:** Tables like `products`, `articles`, and `projects` should have an RLS policy allowing `SELECT` for anonymous/authenticated users.
- **Restricted Write Access:** Only authenticated users with an 'admin' role (or the NestJS backend using a Service Role Key) can `INSERT`, `UPDATE`, or `DELETE` products and content.
- **User Isolation:** A logged-in customer should only be able to `SELECT` their own `orders`.

## Common Workflows
- **Writing Migrations:** When asked to create a table, generate a standard PostgreSQL `CREATE TABLE` script. Include appropriate data types (e.g., `UUID` for primary keys, `TIMESTAMPTZ` for dates).
- **Enabling Security:** Always output the `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;` command along with the specific `CREATE POLICY` statements.
