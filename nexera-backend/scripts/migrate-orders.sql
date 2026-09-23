-- ============================================
-- NEXERA ORDER FLOW - Database Migration
-- Cải tiến bảng orders, order_items và tạo order_status_history
-- ============================================

-- ============================================
-- 1. ALTER TABLE: orders (thêm cột mới)
-- ============================================

-- Mã đơn hàng hiển thị (VD: NX-20260923-001)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_code VARCHAR(30) UNIQUE;

-- Thông tin khách hàng trên đơn (snapshot)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Địa chỉ giao hàng chi tiết
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_ward VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_district VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_province VARCHAR(100);

-- Tài chính chi tiết
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(15,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15,2) DEFAULT 0;

-- Thanh toán
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'UNPAID';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payos_checkout_url TEXT;

-- Vận chuyển
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Đổi kiểu payos_order_code sang BIGINT nếu đang là text
-- (nếu đang có data, cần xóa data test trước)
-- ALTER TABLE orders ALTER COLUMN payos_order_code TYPE BIGINT USING payos_order_code::BIGINT;

-- ============================================
-- 2. ALTER TABLE: order_items (thêm product snapshot)
-- ============================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image VARCHAR(500);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(50);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5,2) DEFAULT 0;

-- ============================================
-- 3. CREATE TABLE: order_status_history
-- ============================================

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by VARCHAR(255),  -- Email admin, 'SYSTEM', hoặc 'CUSTOMER'
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id 
    ON order_status_history(order_id);

-- ============================================
-- 4. Thêm Index cho orders (performance)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 5. Tạo function auto-generate order_code
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_code()
RETURNS TRIGGER AS $$
DECLARE
    today_str TEXT;
    seq_num INTEGER;
BEGIN
    today_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Đếm số đơn hàng hôm nay
    SELECT COUNT(*) + 1 INTO seq_num
    FROM orders
    WHERE order_code LIKE 'NX-' || today_str || '-%';
    
    NEW.order_code := 'NX-' || today_str || '-' || LPAD(seq_num::TEXT, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger auto-generate order_code khi insert
DROP TRIGGER IF EXISTS trg_generate_order_code ON orders;
CREATE TRIGGER trg_generate_order_code
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_code IS NULL)
    EXECUTE FUNCTION generate_order_code();

-- ============================================
-- 6. Tạo function auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- ============================================
-- 7. SEED DATA: Đơn hàng mẫu
-- ============================================

-- Xóa dữ liệu cũ (nếu muốn reset)
-- DELETE FROM order_status_history;
-- DELETE FROM order_items;
-- DELETE FROM orders;

-- Đơn 1: COD - Đã xác nhận, đang chờ xử lý
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, status, note, created_at
) VALUES (
    'a1000001-0001-4000-a000-000000000001',
    'NX-20260920-001',
    'e910be88-3b08-44a0-b6b9-6bbe51bd9afd',
    'Nguyễn Văn An', 'an.nguyen@example.com', '0901234567',
    '123 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
    4200000, 0, 0, 4200000,
    'COD', 'UNPAID', 'CONFIRMED',
    'Giao giờ hành chính, gọi trước 30 phút',
    NOW() - INTERVAL '3 days'
);

-- Order items cho Đơn 1
INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0001-4000-a000-000000000001', '7b129b36-43eb-4158-af3f-8e94f22374cc', 'Tấm Pin Canadian Solar 450W', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'CS-450', 2, 1995000, 5, 3990000),
('a1000001-0001-4000-a000-000000000001', '4937e8ac-f0c0-4043-a0c2-b9dca4d50ee2', 'ẮC QUY ROCKET 12V - 50AH', 'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80', 'Rocket SMF 65B24LS', 1, 210000, 0, 210000);

-- Đơn 2: Chuyển khoản - Đã thanh toán, đang xử lý
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, paid_at, status,
    payos_order_code, note, created_at
) VALUES (
    'a1000001-0002-4000-a000-000000000002',
    'NX-20260921-001',
    '07c4b5f1-82eb-42d5-ad9e-ee2188bbed0b',
    'Trần Thị Bình', 'binh.tran@example.com', '0987654321',
    '45 Lê Lợi', 'Phường Bến Thành', 'Quận 1', 'TP. Hồ Chí Minh',
    4900000, 0, 0, 4900000,
    'BANK_TRANSFER', 'PAID', NOW() - INTERVAL '2 days', 'PROCESSING',
    '923001001',
    'Lắp đặt tầng 3, liên hệ bảo vệ tòa nhà',
    NOW() - INTERVAL '2 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0002-4000-a000-000000000002', '396f9c51-e7c3-4349-a9bf-ab999f11450e', 'Tấm Pin LONGi 540W', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'LG-540', 2, 2450000, 0, 4900000);

-- Đơn 3: COD - Đang giao hàng
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, status,
    shipping_carrier, tracking_number, shipped_at, note, created_at
) VALUES (
    'a1000001-0003-4000-a000-000000000003',
    'NX-20260919-001',
    '5dabb2c9-620d-4e42-8b1f-82c87741a79d',
    'Công ty TNHH ABC', 'contact@abc.vn', '0283456789',
    '789 Điện Biên Phủ', 'Phường 25', 'Quận Bình Thạnh', 'TP. Hồ Chí Minh',
    4140000, 0, 0, 4140000,
    'COD', 'UNPAID', 'SHIPPED',
    'Giao Hàng Nhanh', 'GHN-VN123456789', NOW() - INTERVAL '1 day',
    'Giao cho phòng kỹ thuật, tầng 2',
    NOW() - INTERVAL '4 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0003-4000-a000-000000000003', 'fb365926-f8fd-47a9-ba07-fcb868bd0b2b', 'Tấm Pin Trina Solar 500W', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'TR-500', 2, 2070000, 10, 4140000);

-- Đơn 4: Chuyển khoản - Đã giao thành công
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, paid_at, status,
    shipping_carrier, tracking_number, shipped_at, delivered_at,
    payos_order_code, created_at
) VALUES (
    'a1000001-0004-4000-a000-000000000004',
    'NX-20260918-001',
    'e910be88-3b08-44a0-b6b9-6bbe51bd9afd',
    'Nguyễn Văn An', 'an.nguyen@example.com', '0901234567',
    '123 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
    2480000, 0, 0, 2480000,
    'BANK_TRANSFER', 'PAID', NOW() - INTERVAL '6 days', 'DELIVERED',
    'Viettel Post', 'VTP-987654321', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day',
    '918002001',
    NOW() - INTERVAL '6 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0004-4000-a000-000000000004', '0598c5ae-5fd6-41a4-90bb-73d4a9eb6696', 'Tấm Pin JA Solar 545W', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JA-545', 1, 2480000, 0, 2480000);

-- Đơn 5: COD - Đã hoàn tất
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, paid_at, status,
    shipping_carrier, tracking_number, shipped_at, delivered_at, created_at
) VALUES (
    'a1000001-0005-4000-a000-000000000005',
    'NX-20260915-001',
    '07c4b5f1-82eb-42d5-ad9e-ee2188bbed0b',
    'Trần Thị Bình', 'binh.tran@example.com', '0987654321',
    '45 Lê Lợi', 'Phường Bến Thành', 'Quận 1', 'TP. Hồ Chí Minh',
    2150000, 0, 0, 2150000,
    'COD', 'PAID', NOW() - INTERVAL '6 days', 'COMPLETED',
    'GHTK', 'GHTK-111222333', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '10 days'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0005-4000-a000-000000000005', 'd78b1194-6723-440a-975c-5f94e4b77faf', 'Tấm Pin AE Solar 450W', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'AE-450', 1, 2150000, 0, 2150000);

-- Đơn 6: Chuyển khoản - Đã hủy (hết hạn thanh toán)
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, status,
    cancel_reason, cancelled_by, created_at
) VALUES (
    'a1000001-0006-4000-a000-000000000006',
    'NX-20260922-001',
    '5dabb2c9-620d-4e42-8b1f-82c87741a79d',
    'Công ty TNHH ABC', 'contact@abc.vn', '0283456789',
    '789 Điện Biên Phủ', 'Phường 25', 'Quận Bình Thạnh', 'TP. Hồ Chí Minh',
    1567500, 0, 0, 1567500,
    'BANK_TRANSFER', 'UNPAID', 'CANCELLED',
    'Hết hạn thanh toán (15 phút)', 'SYSTEM',
    NOW() - INTERVAL '1 day'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0006-4000-a000-000000000006', '4937e8ac-f0c0-4043-a0c2-b9dca4d50ee2', 'ẮC QUY ROCKET 12V - 50AH', 'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80', 'Rocket SMF 65B24LS', 1, 1567500, 5, 1567500);

-- Đơn 7: Chuyển khoản - Đang chờ thanh toán (mới tạo)
INSERT INTO orders (
    id, order_code, customer_id, customer_name, customer_email, customer_phone,
    shipping_address, shipping_ward, shipping_district, shipping_province,
    subtotal, shipping_fee, discount_amount, total_amount,
    payment_method, payment_status, status,
    payos_order_code, note, created_at
) VALUES (
    'a1000001-0007-4000-a000-000000000007',
    'NX-20260923-001',
    'e910be88-3b08-44a0-b6b9-6bbe51bd9afd',
    'Nguyễn Văn An', 'an.nguyen@example.com', '0901234567',
    '123 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
    6300000, 0, 0, 6300000,
    'BANK_TRANSFER', 'UNPAID', 'PENDING_PAYMENT',
    '923003001',
    'Cần hóa đơn VAT',
    NOW() - INTERVAL '5 minutes'
);

INSERT INTO order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price) VALUES
('a1000001-0007-4000-a000-000000000007', '7b129b36-43eb-4158-af3f-8e94f22374cc', 'Tấm Pin Canadian Solar 450W', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'CS-450', 2, 1995000, 5, 3990000),
('a1000001-0007-4000-a000-000000000007', '396f9c51-e7c3-4349-a9bf-ab999f11450e', 'Tấm Pin LONGi 540W', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'LG-540', 1, 2450000, 0, 2450000);

-- ============================================
-- 8. SEED: Lịch sử trạng thái mẫu
-- ============================================

-- Đơn 2 (PROCESSING): Created → PENDING_PAYMENT → CONFIRMED → PROCESSING
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
('a1000001-0002-4000-a000-000000000002', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Tạo đơn hàng mới', NOW() - INTERVAL '2 days'),
('a1000001-0002-4000-a000-000000000002', 'PENDING_PAYMENT', 'CONFIRMED', 'SYSTEM', 'Thanh toán PayOS thành công', NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
('a1000001-0002-4000-a000-000000000002', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Đã kiểm tra kho, chuẩn bị đóng gói', NOW() - INTERVAL '1 day');

-- Đơn 3 (SHIPPED): Created → CONFIRMED → PROCESSING → SHIPPED
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
('a1000001-0003-4000-a000-000000000003', NULL, 'CONFIRMED', 'SYSTEM', 'Tạo đơn COD', NOW() - INTERVAL '4 days'),
('a1000001-0003-4000-a000-000000000003', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Đang đóng gói', NOW() - INTERVAL '3 days'),
('a1000001-0003-4000-a000-000000000003', 'PROCESSING', 'SHIPPED', 'admin@nexera.vn', 'Bàn giao GHN, mã vận đơn GHN-VN123456789', NOW() - INTERVAL '1 day');

-- Đơn 4 (DELIVERED): Full lifecycle
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
('a1000001-0004-4000-a000-000000000004', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Tạo đơn hàng mới', NOW() - INTERVAL '6 days'),
('a1000001-0004-4000-a000-000000000004', 'PENDING_PAYMENT', 'CONFIRMED', 'SYSTEM', 'Thanh toán PayOS thành công', NOW() - INTERVAL '6 days' + INTERVAL '5 minutes'),
('a1000001-0004-4000-a000-000000000004', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Chuẩn bị hàng', NOW() - INTERVAL '5 days'),
('a1000001-0004-4000-a000-000000000004', 'PROCESSING', 'SHIPPED', 'admin@nexera.vn', 'Giao Viettel Post', NOW() - INTERVAL '4 days'),
('a1000001-0004-4000-a000-000000000004', 'SHIPPED', 'DELIVERED', 'admin@nexera.vn', 'Giao thành công', NOW() - INTERVAL '1 day');

-- Đơn 5 (COMPLETED): Full lifecycle COD
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
('a1000001-0005-4000-a000-000000000005', NULL, 'CONFIRMED', 'SYSTEM', 'Tạo đơn COD', NOW() - INTERVAL '10 days'),
('a1000001-0005-4000-a000-000000000005', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Đóng gói', NOW() - INTERVAL '9 days'),
('a1000001-0005-4000-a000-000000000005', 'PROCESSING', 'SHIPPED', 'admin@nexera.vn', 'Giao GHTK', NOW() - INTERVAL '7 days'),
('a1000001-0005-4000-a000-000000000005', 'SHIPPED', 'DELIVERED', 'admin@nexera.vn', 'Khách đã nhận, thu COD', NOW() - INTERVAL '6 days'),
('a1000001-0005-4000-a000-000000000005', 'DELIVERED', 'COMPLETED', 'SYSTEM', 'Auto hoàn tất sau 7 ngày', NOW() - INTERVAL '1 day');

-- Đơn 6 (CANCELLED): Created → PENDING → CANCELLED
INSERT INTO order_status_history (order_id, from_status, to_status, changed_by, note, created_at) VALUES
('a1000001-0006-4000-a000-000000000006', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Tạo đơn hàng mới', NOW() - INTERVAL '1 day'),
('a1000001-0006-4000-a000-000000000006', 'PENDING_PAYMENT', 'CANCELLED', 'SYSTEM', 'Hết hạn thanh toán 15 phút', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes');

-- ============================================
-- Done! 7 đơn hàng mẫu + lịch sử trạng thái
-- ============================================
