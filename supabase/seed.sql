-- Xóa dữ liệu cũ (tuân thủ khóa ngoại)
TRUNCATE TABLE order_items, orders, products, categories, customer_notes, chat_messages, conversations, customers, articles, projects RESTART IDENTITY CASCADE;

-- 1. CATEGORIES (Danh mục sản phẩm)
INSERT INTO categories (name, slug, description) VALUES
('Điện Mặt Trời', 'dien-mat-troi', 'Các giải pháp và thiết bị điện năng lượng mặt trời'),
('Biến Tần (Inverter)', 'bien-tan', 'Bộ chuyển đổi điện năng lượng mặt trời'),
('Pin Lưu Trữ', 'pin-luu-tru', 'Hệ thống pin lưu trữ điện năng Lithium'),
('Phần Mềm Quản Lý', 'phan-mem-quan-ly', 'Giải pháp phần mềm chuyển đổi số cho doanh nghiệp');

-- 2. PRODUCTS (Sản phẩm)
INSERT INTO products (name, slug, category_id, type, price, import_price, discount_rate, stock, description, image_url, sku, brand, origin, warranty_info, specifications, images, is_bestseller, restock_date) VALUES
-- Pin Lưu Trữ / Ắc Quy (Chi tiết như ảnh mẫu)
(
    'ẮC QUY ROCKET 12V - 50AH SMF 65B24LS', 'ac-quy-rocket-12v-50ah-smf-65b24ls', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 
    1650000, 1300000, 5, 50, 
    'Ắc quy khô kín khí (miễn bảo dưỡng), khởi động động cơ piston cho xe ô tô, tàu thuyền.', 
    'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80', 'Rocket SMF 65B24LS', 'Rocket', 'Hàn Quốc', '9 tháng (Bảo hành điện tử cùng tem chống hàng giả)', 
    '{"Chủng loại": "Ắc quy khô kín khí (miễn bảo dưỡng)", "Điện áp": "12V", "Dung lượng": "50Ah", "CCA (SAE)": "450CCA", "Công nghệ": "Lead - Acid Accumulators", "Công năng": "Khởi động động cơ piston cho xe ô tô, tàu thuyền", "Vị trí cọc": "L", "Loại cọc": "Cọc to", "Kích thước (dài * rộng * cao)": "238 x 129 x 225 mm", "Thương hiệu": "Rocket", "Phân khúc": "Tầm trung", "Nơi sản xuất": "Hàn Quốc", "Nhà sản xuất": "Sebang Global Co,.LTD", "Bảo hành": "9 tháng (Bảo hành điện tử cùng tem chống hàng giả)"}'::jsonb,
    '[{"url": "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80", "is_primary": false}]'::jsonb,
    false, NULL
),
(
    'ẮC QUY VARTA 12V - 75AH 100D26R (SILVER DYNAMIC)', 'ac-quy-varta-12v-75ah-100d26r', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 
    2055000, 1500000, 11, 0, 
    'Ắc quy Varta dòng Silver Dynamic cao cấp, công nghệ lưới PowerFrame mang lại dòng khởi động mạnh mẽ và độ bền vượt trội.', 
    'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80', 'VT100D26R', 'Varta', 'Hàn Quốc', '9 tháng (Bảo hành điện tử)', 
    '{"Tên sản phẩm": "Ắc quy Varta 12V 75AH 100D26R", "Thương hiệu": "Varta", "Mã bình": "100D26R", "Điện áp": "12V", "Dung lượng": "75AH", "Dung lượng danh định": "75", "Dài x Rộng x Cao": "260mm * 172mm * 225mm", "Vị trí cọc": "R", "Chủng loại": "ắc quy khô (miễn bảo dưỡng)", "Tiêu chuẩn bình": "JIS", "Dòng sản phẩm": "Silver Dynamic SLI", "Xuất xứ": "Hàn Quốc", "Thời gian bảo hành": "9 tháng (Bảo hành điện tử)"}'::jsonb,
    '[{"url": "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80", "is_primary": true}, {"url": "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80", "is_primary": false}, {"url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", "is_primary": false}]'::jsonb,
    true, NOW() + INTERVAL '15 days'
),
(
    'Pin Lưu Trữ Lithium UFO 5kWh', 'pin-luu-tru-lithium-ufo-5kwh', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 
    22000000, 17000000, 5, 35, 
    'Pin Lithium gắn tường 48V 100Ah vòng đời 6000 lần sạc.', 
    'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80', 'UFO-5KWH', 'UFO Power', 'Đài Loan', '5 năm', 
    '{"Điện áp": "48V", "Dung lượng": "100Ah", "Năng lượng": "4.8kWh", "Loại Pin": "LiFePO4"}'::jsonb,
    '[{"url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", "is_primary": true}]'::jsonb,
    true, NULL
),

-- Tấm Pin (Nhiều sản phẩm để test phân trang)
('Tấm Pin Năng Lượng Mặt Trời Jinko 550W', 'tam-pin-jinko-550w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2500000, 2000000, 10, 150, 'Tấm pin Jinko Solar hiệu suất cao thế hệ mới nhất.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JK550-N', 'Jinko Solar', 'Trung Quốc', '12 năm vật lý, 25 năm hiệu suất', '{"Công suất": "550W", "Hiệu suất": "21.3%", "Loại Cell": "Monocrystalline N-type", "Kích thước": "2274 x 1134 x 35 mm"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, true, NULL),
('Tấm Pin Canadian Solar 450W', 'tam-pin-canadian-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2100000, 1800000, 5, 200, 'Tấm pin công suất tiêu chuẩn cho gia đình.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'CS-450', 'Canadian Solar', 'Canada', '10 năm', '{"Công suất": "450W", "Hiệu suất": "20.5%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin LONGi 540W', 'tam-pin-longi-540w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2450000, 2100000, 0, 120, 'Tấm pin LONGi đơn tinh thể.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'LG-540', 'LONGi', 'Trung Quốc', '12 năm', '{"Công suất": "540W", "Hiệu suất": "21.1%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin Trina Solar 500W', 'tam-pin-trina-500w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2300000, 1950000, 10, 80, 'Trina Solar 500W chất lượng cao.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'TR-500', 'Trina', 'Trung Quốc', '10 năm', '{"Công suất": "500W", "Hiệu suất": "20.8%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin JA Solar 545W', 'tam-pin-ja-545w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2480000, 2150000, 0, 50, 'JA Solar hiệu năng vượt trội.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JA-545', 'JA Solar', 'Trung Quốc', '12 năm', '{"Công suất": "545W", "Hiệu suất": "21.2%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin AE Solar 450W', 'tam-pin-ae-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2150000, 1850000, 0, 45, 'AE Solar nhập khẩu châu Âu.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'AE-450', 'AE Solar', 'Đức', '15 năm', '{"Công suất": "450W", "Hiệu suất": "21.0%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin Risen 500W', 'tam-pin-risen-500w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2250000, 1900000, 15, 60, 'Risen Energy tiết kiệm chi phí.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'RS-500', 'Risen', 'Trung Quốc', '10 năm', '{"Công suất": "500W", "Hiệu suất": "20.7%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin Qcells 480W', 'tam-pin-qcells-480w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2400000, 2000000, 5, 0, 'Hanwha Qcells bền bỉ.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'QC-480', 'Qcells', 'Hàn Quốc', '12 năm', '{"Công suất": "480W", "Hiệu suất": "20.9%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, false, NOW() + INTERVAL '10 days'),
('Tấm Pin SunPower 400W', 'tam-pin-sunpower-400w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 3000000, 2500000, 0, 10, 'SunPower Maxeon cao cấp.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'SP-400', 'SunPower', 'Mỹ', '25 năm', '{"Công suất": "400W", "Hiệu suất": "22.6%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Tấm Pin VSUN 450W', 'tam-pin-vsun-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2050000, 1750000, 10, 200, 'VSUN sản xuất tại Việt Nam.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'VS-450', 'VSUN', 'Việt Nam', '12 năm', '{"Công suất": "450W", "Hiệu suất": "20.4%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),

-- Biến Tần
('Biến Tần Hybrid Deye 8kW', 'bien-tan-hybrid-deye-8kw', (SELECT id FROM categories WHERE slug = 'bien-tan' LIMIT 1), 'EQUIPMENT', 35000000, 28000000, 0, 20, 'Inverter Hybrid Deye 8kW 1 pha, kết nối lưới và lưu trữ.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'DEYE-8K-SG01', 'Deye', 'Trung Quốc', '5 năm tiêu chuẩn', '{"Công suất AC": "8000W", "Pha": "1 Pha", "Hỗ trợ lưu trữ": "Có (Hybrid)", "Điện áp Pin": "48V"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb, true, NULL),
('Biến Tần SMA 5kW', 'bien-tan-sma-5kw', (SELECT id FROM categories WHERE slug = 'bien-tan' LIMIT 1), 'EQUIPMENT', 45000000, 38000000, 10, 15, 'SMA Sunny Boy cao cấp.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'SMA-5K', 'SMA', 'Đức', '10 năm', '{"Công suất AC": "5000W", "Pha": "1 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Biến Tần Huawei 10kW', 'bien-tan-huawei-10kw', (SELECT id FROM categories WHERE slug = 'bien-tan' LIMIT 1), 'EQUIPMENT', 40000000, 32000000, 5, 25, 'Huawei SUN2000 3 pha.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'HW-10K', 'Huawei', 'Trung Quốc', '5 năm', '{"Công suất AC": "10000W", "Pha": "3 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Biến Tần Growatt 5kW', 'bien-tan-growatt-5kw', (SELECT id FROM categories WHERE slug = 'bien-tan' LIMIT 1), 'EQUIPMENT', 22000000, 18000000, 0, 30, 'Growatt MIN 5000TL-X.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'GW-5K', 'Growatt', 'Trung Quốc', '5 năm', '{"Công suất AC": "5000W", "Pha": "1 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),

-- Gói & Phần mềm
('Hệ Thống Điện Mặt Trời Áp Mái 5kWp', 'he-thong-dien-mat-troi-ap-mai-5kwp', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'PACKAGE', 65000000, 50000000, 0, 5, 'Trọn gói lắp đặt hệ thống 5kWp cho hộ gia đình (Bao gồm vật tư và nhân công).', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'PKG-5KWP', 'Nexera', 'Việt Nam', '2 năm trọn gói', '{"Quy mô": "Hộ gia đình", "Sản lượng dự kiến": "600-700 kWh/tháng", "Bao gồm thi công": "Có"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, true, NULL),
('Hệ Thống Điện Mặt Trời 10kWp', 'he-thong-dien-mat-troi-10kwp', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'PACKAGE', 120000000, 95000000, 10, 2, 'Trọn gói 10kWp 3 pha.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'PKG-10K', 'Nexera', 'Việt Nam', '2 năm', '{"Quy mô": "Biệt thự / Xưởng nhỏ"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, true, NULL),
('Phần Mềm Quản Lý Kho Bãi N-WMS', 'phan-mem-quan-ly-kho-bai-n-wms', (SELECT id FROM categories WHERE slug = 'phan-mem-quan-ly' LIMIT 1), 'PACKAGE', 15000000, 5000000, 20, 999, 'Giải pháp quản lý kho thông minh tích hợp IoT.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 'SFT-NWMS', 'Nexera Tech', 'Việt Nam', '12 tháng hỗ trợ kỹ thuật', '{"Nền tảng": "Web/Mobile App", "Số lượng User": "Không giới hạn", "Phân hệ": "Nhập, Xuất, Tồn kho, Báo cáo"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL),
('Phần Mềm Quản Lý Điện Năng N-EMS', 'phan-mem-quan-ly-dien-n-ems', (SELECT id FROM categories WHERE slug = 'phan-mem-quan-ly' LIMIT 1), 'PACKAGE', 25000000, 8000000, 0, 999, 'Hệ thống giám sát điện năng IoT.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 'SFT-NEMS', 'Nexera Tech', 'Việt Nam', '1 năm', '{"Nền tảng": "Web/App"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "is_primary": true}]'::jsonb, false, NULL);

-- 3. CUSTOMERS (Khách hàng)
INSERT INTO customers (full_name, phone, email, phone_numbers, emails, address, tier, notes, tags) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@example.com', '{"0901234567"}', '{"an.nguyen@example.com"}', '123 Nguyễn Văn Linh, Quận 7, TP.HCM', 'STANDARD', 'Khách hàng quan tâm đến năng lượng mặt trời áp mái.', '{"Solar", "Q7"}'),
('Trần Thị Bình', '0987654321', 'binh.tran@example.com', '{"0987654321"}', '{"binh.tran@example.com"}', '45 Lê Duẩn, Quận 1, TP.HCM', 'PREMIUM', 'Khách VIP, thường xuyên mua lẻ thiết bị.', '{"VIP", "Q1"}'),
('Công ty TNHH ABC', '0283456789', 'contact@abc.vn', '{"0283456789"}', '{"contact@abc.vn"}', 'KCN Sóng Thần, Bình Dương', 'VIP', 'Công ty cần xuất hóa đơn đỏ.', '{"B2B", "BinhDuong"}');

-- 4. ORDERS (Đơn hàng)
INSERT INTO orders (customer_id, status, total_amount, note) VALUES
((SELECT id FROM customers WHERE email = 'an.nguyen@example.com' LIMIT 1), 'COMPLETED', 65000000, 'Lắp đặt vào cuối tuần'),
((SELECT id FROM customers WHERE email = 'binh.tran@example.com' LIMIT 1), 'SHIPPED', 2500000, 'Giao giờ hành chính'),
((SELECT id FROM customers WHERE email = 'contact@abc.vn' LIMIT 1), 'PENDING', 110000000, 'Cần xuất hóa đơn VAT công ty');

-- 5. ORDER ITEMS (Chi tiết đơn hàng)
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(
  (SELECT id FROM orders WHERE note = 'Lắp đặt vào cuối tuần' LIMIT 1), 
  (SELECT id FROM products WHERE slug = 'he-thong-dien-mat-troi-ap-mai-5kwp' LIMIT 1), 
  1, 65000000, 65000000
),
(
  (SELECT id FROM orders WHERE note = 'Giao giờ hành chính' LIMIT 1), 
  (SELECT id FROM products WHERE slug = 'tam-pin-jinko-550w' LIMIT 1), 
  1, 2500000, 2500000
),
(
  (SELECT id FROM orders WHERE note = 'Cần xuất hóa đơn VAT công ty' LIMIT 1), 
  (SELECT id FROM products WHERE slug = 'bien-tan-hybrid-deye-8kw' LIMIT 1), 
  2, 35000000, 70000000
),
(
  (SELECT id FROM orders WHERE note = 'Cần xuất hóa đơn VAT công ty' LIMIT 1), 
  (SELECT id FROM products WHERE slug = 'pin-luu-tru-lithium-ufo-5kwh' LIMIT 1), 
  2, 20000000, 40000000
);

-- 6. CONVERSATIONS & CHAT (Replaces LEADS)
INSERT INTO conversations (id, customer_id, guest_name, guest_phone, guest_email, status, last_message_preview) VALUES
('11111111-1111-1111-1111-111111111111', NULL, 'Lê Hoàng Khang', '0933112233', 'khang.le@gmail.com', 'OPEN', 'Tôi muốn tư vấn hệ thống điện mặt trời 10kW cho nhà xưởng'),
('22222222-2222-2222-2222-222222222222', NULL, 'Phạm Thị Dung', '0911445566', '', 'PENDING', 'Báo giá pin lưu trữ'),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM customers WHERE email = 'contact@abc.vn' LIMIT 1), 'Công ty TNHH ABC', '0283456789', 'contact@abc.vn', 'RESOLVED', 'Cảm ơn đã hỗ trợ.');

INSERT INTO chat_messages (conversation_id, sender_type, sender_name, content) VALUES
('11111111-1111-1111-1111-111111111111', 'CUSTOMER', 'Lê Hoàng Khang', 'Tôi muốn tư vấn hệ thống điện mặt trời 10kW cho nhà xưởng'),
('22222222-2222-2222-2222-222222222222', 'CUSTOMER', 'Phạm Thị Dung', 'Báo giá pin lưu trữ'),
('33333333-3333-3333-3333-333333333333', 'CUSTOMER', 'Công ty TNHH ABC', 'Xin chào, tôi cần hỗ trợ về phần mềm kho'),
('33333333-3333-3333-3333-333333333333', 'ADMIN', 'Admin', 'Chào bạn, bạn cần hỗ trợ gì ạ?'),
('33333333-3333-3333-3333-333333333333', 'CUSTOMER', 'Công ty TNHH ABC', 'Cảm ơn đã hỗ trợ.');

-- 7. CUSTOMER NOTES
INSERT INTO customer_notes (customer_id, content) VALUES
((SELECT id FROM customers WHERE email = 'an.nguyen@example.com' LIMIT 1), 'Đã gọi điện tư vấn hệ thống 5kWp, khách đang cân nhắc.'),
((SELECT id FROM customers WHERE email = 'contact@abc.vn' LIMIT 1), 'Gửi báo giá phần mềm kho, hẹn tuần sau phản hồi.');

-- 7. ARTICLES (Bài viết)
INSERT INTO articles (title, slug, content, image_url, published_at) VALUES
('5 Lợi ích khi lắp đặt điện mặt trời cho doanh nghiệp', '5-loi-ich-dien-mat-troi-doanh-nghiep', 'Điện mặt trời giúp doanh nghiệp tiết kiệm chi phí, đạt chứng chỉ xanh...', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', NOW() - INTERVAL '2 days'),
('Xu hướng chuyển đổi số năm 2026', 'xu-huong-chuyen-doi-so-2026', 'AI và IoT tiếp tục dẫn đầu trong công cuộc chuyển đổi số...', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', NOW() - INTERVAL '10 days');

-- 8. PROJECTS (Dự án tiêu biểu)
INSERT INTO projects (name, category, description, image_url, completion_date) VALUES
('Dự án Điện Mặt Trời 1MWp - KCN Amata', 'INDUSTRIAL', 'Lắp đặt 1MWp cho nhà máy dệt may, giảm 30% chi phí điện.', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9cce?w=800&q=80', '2026-05-15'),
('Hệ thống Smart Home Villa Quận 2', 'RESIDENTIAL', 'Tích hợp điện mặt trời, pin lưu trữ và điều khiển thông minh toàn diện.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', '2026-08-01');
