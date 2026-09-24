-- ==============================================================================
-- NEXERA SYSTEM ENUMS MIGRATION
-- File: supabase/migrations/20260924_create_system_enums.sql
-- Description: Tạo toàn bộ các kiểu PostgreSQL ENUM chuẩn hóa dữ liệu cho hệ thống
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUMS CHO ĐƠN HÀNG & THANH TOÁN (ORDERS & PAYMENTS)
-- ------------------------------------------------------------------------------

-- 1.1 Trạng thái Vận hành Đơn hàng (Chuẩn 3PL)
DO $$ BEGIN
    CREATE TYPE public.order_status_enum AS ENUM (
        'PENDING_PAYMENT', -- Chờ thanh toán QR (tối đa 15p)
        'CONFIRMED',       -- Chờ soát đơn (Đã TT hoặc COD mới)
        'PROCESSING',      -- Chờ gửi bưu cục / Đang đóng gói
        'SHIPPED',         -- Đã gửi bên thứ 3 (GHN, Viettel Post, ...)
        'DELIVERED',       -- Đã giao thành công
        'RETURNED',        -- Hoàn hàng / Khách boom
        'CANCELLED'        -- Đã hủy
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.2 Phương thức thanh toán
DO $$ BEGIN
    CREATE TYPE public.payment_method_enum AS ENUM (
        'BANK_TRANSFER',   -- Chuyển khoản QR (PayOS VietQR)
        'COD'              -- Thu hộ tiền mặt khi nhận hàng
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.3 Trạng thái dòng tiền
DO $$ BEGIN
    CREATE TYPE public.payment_status_enum AS ENUM (
        'UNPAID',          -- Chưa nhận tiền
        'PAID',            -- Đã nhận tiền
        'REFUNDED'         -- Đã hoàn tiền
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1.4 Đối tượng hủy đơn
DO $$ BEGIN
    CREATE TYPE public.order_cancelled_by_enum AS ENUM (
        'ADMIN',
        'CUSTOMER',
        'SYSTEM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. ENUMS CHO LIVE CHAT & HỘI THOẠI (CHAT & CRM)
-- ------------------------------------------------------------------------------

-- 2.1 Trạng thái phiên chat
DO $$ BEGIN
    CREATE TYPE public.conversation_status_enum AS ENUM (
        'OPEN',            -- Đang mở / Khách đang chat
        'PENDING',         -- Chờ khách hoặc nhân viên phản hồi
        'RESOLVED',        -- Đã tư vấn xong
        'CLOSED'           -- Đã đóng phiên
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2.2 Loại người gửi tin nhắn
DO $$ BEGIN
    CREATE TYPE public.chat_sender_type_enum AS ENUM (
        'CUSTOMER',        -- Khách hàng / Khách vãng lai
        'ADMIN',           -- Nhân viên CSKH / Quản trị viên
        'SYSTEM',          -- Thông báo hệ thống
        'AI'               -- Trợ lý ảo AI
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 3. ENUMS CHO KHÁCH HÀNG & CRM (CUSTOMERS & CRM)
-- ------------------------------------------------------------------------------

-- 3.1 Phân hạng khách hàng CRM
DO $$ BEGIN
    CREATE TYPE public.customer_tier_enum AS ENUM (
        'STANDARD',        -- Khách tiêu chuẩn
        'POTENTIAL',       -- Khách tiềm năng (hỏi giá, quan tâm gói lớn)
        'LOYAL',           -- Khách thân thiết (mua nhiều lần)
        'VIP'              -- Khách VIP / Doanh nghiệp
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 4. ENUMS CHO SẢN PHẨM & KHO HÀNG (CATALOG & INVENTORY)
-- ------------------------------------------------------------------------------

-- 4.1 Phân loại hình thức sản phẩm
DO $$ BEGIN
    CREATE TYPE public.product_type_enum AS ENUM (
        'EQUIPMENT',       -- Thiết bị đơn lẻ (Tấm pin, Biến tần, Dây cáp, ...)
        'PACKAGE'          -- Gói combo trọn gói (Gói 5kW gia đình, Gói 100kW xưởng, ...)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4.2 Trạng thái kinh doanh sản phẩm
DO $$ BEGIN
    CREATE TYPE public.product_status_enum AS ENUM (
        'ACTIVE',          -- Đang kinh doanh
        'INACTIVE',        -- Tạm ẩn khỏi website
        'DRAFT',           -- Bản nháp
        'OUT_OF_STOCK'     -- Hết hàng
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 5. ENUMS CHO NỘI DUNG & DỰ ÁN (CMS & CONTENT)
-- ------------------------------------------------------------------------------

-- 5.1 Trạng thái bài viết
DO $$ BEGIN
    CREATE TYPE public.article_status_enum AS ENUM (
        'DRAFT',           -- Bản nháp
        'PUBLISHED',       -- Đã xuất bản
        'ARCHIVED'         -- Lưu trữ
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5.2 Loại bài viết
DO $$ BEGIN
    CREATE TYPE public.article_type_enum AS ENUM (
        'NEWS',            -- Tin tức ngành
        'GUIDE',           -- Hướng dẫn / Cẩm nang
        'PROMOTION'        -- Khuyến mãi
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5.3 Phân loại danh mục dự án lắp đặt
DO $$ BEGIN
    CREATE TYPE public.project_category_enum AS ENUM (
        'INDUSTRIAL',      -- Công nghiệp / Nhà máy
        'RESIDENTIAL',     -- Dân dụng / Hộ gia đình
        'AGRICULTURAL',    -- Nông nghiệp
        'COMMERCIAL'       -- Thương mại / Tòa nhà
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 6. ENUMS CHO NHẬT KÝ HOẠT ĐỘNG (AUDIT LOGS)
-- ------------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE public.log_severity_enum AS ENUM (
        'INFO',
        'WARNING',
        'CRITICAL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 7. CHUẨN HÓA DỮ LIỆU CŨ TRƯỚC KHI GẮN RÀNG BUỘC (DATA SANITIZATION)
-- ==============================================================================

-- 7.1 Chuẩn hóa bảng customers (Ví dụ: dữ liệu cũ chứa 'PREMIUM' -> chuẩn hóa thành 'VIP')
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        UPDATE public.customers
        SET tier = CASE 
            WHEN UPPER(COALESCE(tier, '')) IN ('PREMIUM', 'VIP', 'GOLD', 'PLATINUM') THEN 'VIP'
            WHEN UPPER(COALESCE(tier, '')) IN ('LOYAL', 'SILVER') THEN 'LOYAL'
            WHEN UPPER(COALESCE(tier, '')) IN ('POTENTIAL') THEN 'POTENTIAL'
            ELSE 'STANDARD'
        END
        WHERE tier IS NOT NULL AND tier NOT IN ('STANDARD', 'POTENTIAL', 'LOYAL', 'VIP');
    END IF;
END $$;

-- 7.2 Chuẩn hóa bảng orders (Dữ liệu cũ có thể chứa 'PENDING', 'COMPLETED', ...)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        UPDATE public.orders
        SET status = CASE 
            WHEN status IN ('PENDING', 'pending') THEN 'PENDING_PAYMENT'
            WHEN status IN ('COMPLETED', 'completed') THEN 'DELIVERED'
            WHEN status IN ('REFUNDED', 'refunded') THEN 'RETURNED'
            WHEN status IN ('PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED') THEN status
            ELSE 'CONFIRMED'
        END
        WHERE status IS NOT NULL AND status NOT IN ('PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED');

        UPDATE public.orders
        SET payment_method = CASE 
            WHEN UPPER(COALESCE(payment_method, '')) IN ('COD', 'CASH') THEN 'COD'
            WHEN UPPER(COALESCE(payment_method, '')) IN ('BANK_TRANSFER', 'PAYOS', 'VNPAY', 'MOMO', 'ZALOPAY', 'QR') THEN 'BANK_TRANSFER'
            ELSE 'BANK_TRANSFER'
        END
        WHERE payment_method IS NOT NULL AND payment_method NOT IN ('BANK_TRANSFER', 'COD');

        UPDATE public.orders
        SET payment_status = CASE 
            WHEN UPPER(COALESCE(payment_status, '')) IN ('PAID', 'SUCCESS') THEN 'PAID'
            WHEN UPPER(COALESCE(payment_status, '')) IN ('REFUNDED') THEN 'REFUNDED'
            ELSE 'UNPAID'
        END
        WHERE payment_status IS NOT NULL AND payment_status NOT IN ('UNPAID', 'PAID', 'REFUNDED');
    END IF;
END $$;

-- 7.3 Chuẩn hóa bảng chat_messages & conversations
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        UPDATE public.chat_messages
        SET sender_type = CASE 
            WHEN UPPER(COALESCE(sender_type, '')) IN ('CUSTOMER', 'USER', 'GUEST') THEN 'CUSTOMER'
            WHEN UPPER(COALESCE(sender_type, '')) IN ('ADMIN', 'STAFF') THEN 'ADMIN'
            WHEN UPPER(COALESCE(sender_type, '')) IN ('AI', 'BOT') THEN 'AI'
            ELSE 'SYSTEM'
        END
        WHERE sender_type NOT IN ('CUSTOMER', 'ADMIN', 'SYSTEM', 'AI');
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        UPDATE public.conversations
        SET status = CASE 
            WHEN UPPER(COALESCE(status, '')) IN ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED') THEN UPPER(status)
            ELSE 'OPEN'
        END
        WHERE status NOT IN ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');
    END IF;
END $$;

-- ==============================================================================
-- 8. GẮN CHECK CONSTRAINTS BẢO VỆ TOÀN VẸN DỮ LIỆU
-- ==============================================================================

-- 8.1 Bảng orders: Áp dụng CHECK constraint an toàn
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_status 
    CHECK (status IN ('PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_payment_status 
    CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_payment_method;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_payment_method 
    CHECK (payment_method IS NULL OR payment_method IN ('BANK_TRANSFER', 'COD'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_cancelled_by;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_cancelled_by 
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('ADMIN', 'CUSTOMER', 'SYSTEM'));

-- 8.2 Bảng conversations (Live Chat):
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS chk_conversations_status;
        ALTER TABLE public.conversations ADD CONSTRAINT chk_conversations_status 
            CHECK (status IN ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED'));
    END IF;
END $$;

-- 8.3 Bảng chat_messages (Tin nhắn):
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chk_chat_messages_sender_type;
        ALTER TABLE public.chat_messages ADD CONSTRAINT chk_chat_messages_sender_type 
            CHECK (sender_type IN ('CUSTOMER', 'ADMIN', 'SYSTEM', 'AI'));
    END IF;
END $$;

-- 8.4 Bảng customers (CRM Tier):
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS chk_customers_tier;
        ALTER TABLE public.customers ADD CONSTRAINT chk_customers_tier 
            CHECK (tier IS NULL OR tier IN ('STANDARD', 'POTENTIAL', 'LOYAL', 'VIP'));
    END IF;
END $$;
