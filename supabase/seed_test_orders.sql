-- ==============================================================================
-- NEXERA ORDER & PAYMENT FLOW - SEED DỮ LIỆU ĐƠN HÀNG MẪU (CHUẨN 3PL MỚI)
-- Chạy script này trong Supabase SQL Editor để xóa data cũ và tạo lại 10 đơn hàng mẫu
-- mô tả đầy đủ các bước đầu tiên của COD, Chuyển khoản VietQR và toàn bộ chu trình 3PL.
-- ==============================================================================

-- BƯỚC 1: XÓA SẠCH DỮ LIỆU ĐƠN HÀNG CŨ (Theo đúng thứ tự khóa ngoại)
DELETE FROM public.order_status_history;
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- BƯỚC 2: TẠO 10 ĐƠN HÀNG MẪU ĐẦY ĐỦ CÁC BƯỚC VÀ TRẠNG THÁI
DO $$
DECLARE
    v_cust_id UUID;
    v_prod_id UUID;
    v_prod_id_2 UUID;
BEGIN
    -- Lấy ID khách hàng và sản phẩm đầu tiên có sẵn trong database
    SELECT id INTO v_cust_id FROM public.customers LIMIT 1;
    SELECT id INTO v_prod_id FROM public.products ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO v_prod_id_2 FROM public.products ORDER BY created_at DESC LIMIT 1;

    -- ==========================================================================
    -- 1. BƯỚC KHỞI ĐẦU CHUYỂN KHOẢN: PENDING_PAYMENT (Chờ quét mã VietQR)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        payos_order_code, payos_checkout_url, note, created_at
    ) VALUES (
        'b1000001-0001-4000-a000-000000000001',
        'NX-20260924-001',
        v_cust_id,
        'Nguyễn Văn Nam', 'nam.nguyen@example.com', '0912345678',
        'Số 12 ngõ 45 Cầu Giấy', 'Phường Dịch Vọng', 'Quận Cầu Giấy', 'Hà Nội',
        1850000, 0, 0, 1850000,
        'BANK_TRANSFER', 'UNPAID', 'PENDING_PAYMENT',
        '924001', 'https://pay.payos.vn/web/demo924001',
        'Khách vừa tạo link VietQR, đang mở app ngân hàng quét mã (tối đa 15p)',
        NOW() - INTERVAL '5 minutes'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0001-4000-a000-000000000001', v_prod_id,
        'Tấm Pin Năng Lượng Mặt Trời Canadian 450W',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
        'CS-450W', 1, 1850000, 0, 1850000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES ('b1000001-0001-4000-a000-000000000001', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Khách tạo đơn hàng chọn VietQR PayOS', NOW() - INTERVAL '5 minutes');

    -- ==========================================================================
    -- 2. BƯỚC KHỞI ĐẦU CHUYỂN KHOẢN: CONFIRMED (Đã nhận tiền PayOS -> Chờ soát đơn)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, paid_at, status,
        payos_order_code, note, created_at
    ) VALUES (
        'b1000001-0002-4000-a000-000000000002',
        'NX-20260924-002',
        v_cust_id,
        'Trần Thị Mai', 'mai.tran@example.com', '0988776655',
        'Căn hộ 12A Tòa Landmark 81', 'Phường 22', 'Quận Bình Thạnh', 'TP. Hồ Chí Minh',
        4900000, 0, 0, 4900000,
        'BANK_TRANSFER', 'PAID', NOW() - INTERVAL '25 minutes', 'CONFIRMED',
        '924002',
        'Khách đã thanh toán tiền trước qua VietQR PayOS ➔ Chờ Admin soát đơn & chuyển đóng gói',
        NOW() - INTERVAL '30 minutes'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0002-4000-a000-000000000002', v_prod_id,
        'Tấm Pin Năng Lượng Mặt Trời LONGi 540W',
        'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
        'LG-540W', 2, 2450000, 0, 4900000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0002-4000-a000-000000000002', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Khách tạo đơn hàng', NOW() - INTERVAL '30 minutes'),
    ('b1000001-0002-4000-a000-000000000002', 'PENDING_PAYMENT', 'CONFIRMED', 'SYSTEM', 'Webhook PayOS khớp tiền thành công (PAID)', NOW() - INTERVAL '25 minutes');

    -- ==========================================================================
    -- 3. BƯỚC KHỞI ĐẦU COD: CONFIRMED (Khách vừa đặt COD -> Chờ soát đơn)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        note, created_at
    ) VALUES (
        'b1000001-0003-4000-a000-000000000003',
        'NX-20260924-003',
        v_cust_id,
        'Lê Hoàng Long', 'long.le@example.com', '0933445566',
        'Số 88 đường 3/2', 'Phường Hưng Lợi', 'Quận Ninh Kiều', 'Cần Thơ',
        1250000, 0, 0, 1250000,
        'COD', 'UNPAID', 'CONFIRMED',
        'Khách chọn COD, cần gọi xác nhận số nhà trước khi đóng gói',
        NOW() - INTERVAL '1 hour'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0003-4000-a000-000000000003', v_prod_id,
        'Biến Tần Inverter Hybrid 3kW Nexera',
        'https://images.unsplash.com/photo-1548611716-ad994468f9b9?w=800&q=80',
        'INV-3KW', 1, 1250000, 0, 1250000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES ('b1000001-0003-4000-a000-000000000003', NULL, 'CONFIRMED', 'SYSTEM', 'Khách đặt đơn COD mới (Chờ soát đơn)', NOW() - INTERVAL '1 hour');

    -- ==========================================================================
    -- 4. BƯỚC 2: PROCESSING (Đã soát đơn, Kho đang đóng gói - CHƯA GỬI BƯU CỤC - COD)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        note, created_at
    ) VALUES (
        'b1000001-0004-4000-a000-000000000004',
        'NX-20260924-004',
        v_cust_id,
        'Phạm Văn Tuấn', 'tuan.pham@example.com', '0977112233',
        'Thôn 3 Xã An Đồng', 'Xã An Đồng', 'Huyện An Dương', 'Hải Phòng',
        3500000, 0, 0, 3500000,
        'COD', 'UNPAID', 'PROCESSING',
        'Đã gọi điện chốt đơn, kho đang đóng thùng chờ shipper bưu cục qua lấy hàng',
        NOW() - INTERVAL '3 hours'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0004-4000-a000-000000000004', v_prod_id_2,
        'Bộ Phụ Kiện Lắp Đặt Ray Nhôm Năng Lượng Mặt Trời',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
        'RAY-NHOM-01', 5, 700000, 0, 3500000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0004-4000-a000-000000000004', NULL, 'CONFIRMED', 'SYSTEM', 'Khách đặt COD', NOW() - INTERVAL '3 hours'),
    ('b1000001-0004-4000-a000-000000000004', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Admin đã soát đơn và duyệt đóng gói', NOW() - INTERVAL '2 hours');

    -- ==========================================================================
    -- 5. BƯỚC 2: PROCESSING (Đang đóng gói - CHƯA GỬI BƯU CỤC - CHUYỂN KHOẢN ĐÃ TRẢ TIỀN)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, paid_at, status,
        payos_order_code, note, created_at
    ) VALUES (
        'b1000001-0005-4000-a000-000000000005',
        'NX-20260924-005',
        v_cust_id,
        'Vũ Minh Khôi', 'khoi.vu@example.com', '0944889900',
        'Số 15 Lê Duẩn', 'Phường Hải Châu 1', 'Quận Hải Châu', 'Đà Nẵng',
        6800000, 0, 0, 6800000,
        'BANK_TRANSFER', 'PAID', NOW() - INTERVAL '4 hours', 'PROCESSING',
        '924005',
        'Khách đã thanh toán đủ tiền, kho đang dán tem đóng kiện',
        NOW() - INTERVAL '5 hours'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0005-4000-a000-000000000005', v_prod_id,
        'Pin Lưu Trữ Lithium UFO 5kWh',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
        'BAT-5KWH', 1, 6800000, 0, 6800000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0005-4000-a000-000000000005', NULL, 'PENDING_PAYMENT', 'SYSTEM', 'Khách tạo đơn QR', NOW() - INTERVAL '5 hours'),
    ('b1000001-0005-4000-a000-000000000005', 'PENDING_PAYMENT', 'CONFIRMED', 'SYSTEM', 'Thanh toán PayOS thành công', NOW() - INTERVAL '4 hours'),
    ('b1000001-0005-4000-a000-000000000005', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Admin duyệt lệnh xuất kho', NOW() - INTERVAL '3 hours');

    -- ==========================================================================
    -- 6. BƯỚC 3: SHIPPED (ĐÃ GỬI BÊN THỨ 3 - GHN Thu hộ COD)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        shipping_carrier, tracking_number, shipped_at, note, created_at
    ) VALUES (
        'b1000001-0006-4000-a000-000000000006',
        'NX-20260924-006',
        v_cust_id,
        'Đỗ Quốc Bảo', 'bao.do@example.com', '0966554433',
        'Khu đô thị Ecopark', 'Xã Xuân Quan', 'Huyện Văn Giang', 'Hưng Yên',
        2100000, 0, 0, 2100000,
        'COD', 'UNPAID', 'SHIPPED',
        'Giao Hàng Nhanh (GHN)', 'GHN882910381', NOW() - INTERVAL '1 day',
        'Đã bàn giao bưu cục GHN, tài xế đang giao',
        NOW() - INTERVAL '1 day 4 hours'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0006-4000-a000-000000000006', v_prod_id_2,
        'Tấm Pin Canadian Solar 450W',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
        'CS-450', 1, 2100000, 0, 2100000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0006-4000-a000-000000000006', 'CONFIRMED', 'PROCESSING', 'admin@nexera.vn', 'Kho đóng gói', NOW() - INTERVAL '1 day 2 hours'),
    ('b1000001-0006-4000-a000-000000000006', 'PROCESSING', 'SHIPPED', 'admin@nexera.vn', 'Đã bàn giao GHN - Mã: GHN882910381', NOW() - INTERVAL '1 day');

    -- ==========================================================================
    -- 7. BƯỚC 3: SHIPPED (ĐÃ GỬI BÊN THỨ 3 - Viettel Post đã thanh toán trước)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, paid_at, status,
        shipping_carrier, tracking_number, shipped_at, payos_order_code, created_at
    ) VALUES (
        'b1000001-0007-4000-a000-000000000007',
        'NX-20260924-007',
        v_cust_id,
        'Hoàng Thị Yến', 'yen.hoang@example.com', '0922334411',
        'Số 99 Hùng Vương', 'Phường Tân Lập', 'TP. Buôn Ma Thuột', 'Đắk Lắk',
        5200000, 0, 0, 5200000,
        'BANK_TRANSFER', 'PAID', NOW() - INTERVAL '2 days', 'SHIPPED',
        'Viettel Post', 'VTP98231028', NOW() - INTERVAL '1 day',
        '924007', NOW() - INTERVAL '2 days'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0007-4000-a000-000000000007', v_prod_id,
        'Biến Tần Năng Lượng Mặt Trời Deye 5kW',
        'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80',
        'DEYE-5KW', 1, 5200000, 0, 5200000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0007-4000-a000-000000000007', 'PROCESSING', 'SHIPPED', 'admin@nexera.vn', 'Đã bàn giao Viettel Post - Mã: VTP98231028', NOW() - INTERVAL '1 day');

    -- ==========================================================================
    -- 8. BƯỚC 4: DELIVERED (ĐÃ GIAO THÀNH CÔNG - COD thu tiền xong -> PAID)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, paid_at, status,
        shipping_carrier, tracking_number, shipped_at, delivered_at, created_at
    ) VALUES (
        'b1000001-0008-4000-a000-000000000008',
        'NX-20260924-008',
        v_cust_id,
        'Bùi Đình Trọng', 'trong.bui@example.com', '0911223344',
        'Số 234 Trần Phú', 'Phường Phước Vĩnh', 'TP. Huế', 'Thừa Thiên Huế',
        3100000, 0, 0, 3100000,
        'COD', 'PAID', NOW() - INTERVAL '4 hours', 'DELIVERED',
        'Giao Hàng Tiết Kiệm (GHTK)', 'GHTK110293881', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours',
        NOW() - INTERVAL '3 days'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0008-4000-a000-000000000008', v_prod_id_2,
        'Tấm Pin Năng Lượng Mặt Trời Trina 500W',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
        'TR-500W', 1, 3100000, 0, 3100000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0008-4000-a000-000000000008', 'SHIPPED', 'DELIVERED', 'admin@nexera.vn', 'Bưu tá GHTK phát thành công và đã thu tiền COD', NOW() - INTERVAL '4 hours');

    -- ==========================================================================
    -- 9. RETURNED: BƯU CỤC HOÀN HÀNG (Khách boom hàng / từ chối nhận)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        shipping_carrier, tracking_number, shipped_at,
        cancel_reason, created_at
    ) VALUES (
        'b1000001-0009-4000-a000-000000000009',
        'NX-20260924-009',
        v_cust_id,
        'Đặng Quốc Dũng', 'dung.dang@example.com', '0909988776',
        'Số 50 Đại lộ Bình Dương', 'Phường Phú Hòa', 'TP. Thủ Dầu Một', 'Bình Dương',
        1950000, 0, 0, 1950000,
        'COD', 'UNPAID', 'RETURNED',
        'Giao Hàng Nhanh (GHN)', 'GHN990182740', NOW() - INTERVAL '3 days',
        'Khách từ chối nhận hàng do đổi ý (Boom hàng) ➔ Bưu cục chuyển hoàn hàng về kho',
        NOW() - INTERVAL '4 days'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0009-4000-a000-000000000009', v_prod_id,
        'Đèn Năng Lượng Mặt Trời Liền Thể 200W',
        'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
        'DEN-200W', 1, 1950000, 0, 1950000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0009-4000-a000-000000000009', 'SHIPPED', 'RETURNED', 'admin@nexera.vn', 'Báo hoàn hàng do khách boom ➔ Đã hoàn lại tồn kho', NOW() - INTERVAL '1 day');

    -- ==========================================================================
    -- 10. CANCELLED: ĐƠN ĐÃ HỦY (Quá hạn 15p VietQR hoặc Khách hủy)
    -- ==========================================================================
    INSERT INTO public.orders (
        id, order_code, customer_id, customer_name, customer_email, customer_phone,
        shipping_address, shipping_ward, shipping_district, shipping_province,
        subtotal, shipping_fee, discount_amount, total_amount,
        payment_method, payment_status, status,
        cancel_reason, cancelled_by, created_at
    ) VALUES (
        'b1000001-0010-4000-a000-000000000010',
        'NX-20260924-010',
        v_cust_id,
        'Ngô Tấn Tài', 'tai.ngo@example.com', '0931234567',
        'Số 120 đường Pasteur', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh',
        2800000, 0, 0, 2800000,
        'BANK_TRANSFER', 'UNPAID', 'CANCELLED',
        'Hết hạn thanh toán VietQR (15 phút)', 'SYSTEM',
        NOW() - INTERVAL '1 day'
    );

    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, product_sku, quantity, unit_price, discount_rate, total_price)
    VALUES (
        'b1000001-0010-4000-a000-000000000010', v_prod_id_2,
        'Dây Cáp Điện Chuyên Dụng DC 4mm2 (100m)',
        'https://images.unsplash.com/photo-1548611716-ad994468f9b9?w=800&q=80',
        'CAP-DC-4MM', 1, 2800000, 0, 2800000
    );

    INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, created_at)
    VALUES 
    ('b1000001-0010-4000-a000-000000000010', 'PENDING_PAYMENT', 'CANCELLED', 'SYSTEM', 'Tự động hủy do hết hạn 15 phút', NOW() - INTERVAL '23 hours');

END $$;
