-- 1. Xoá dữ liệu sản phẩm, danh mục và các bảng liên quan (giữ nguyên cấu trúc)
TRUNCATE TABLE public.categories CASCADE;

-- 2. Thêm danh mục mới (quy định thứ tự bằng created_at)
INSERT INTO public.categories (id, name, slug, description, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Xe điện', 'xe-dien', 'Các dòng xe điện thân thiện với môi trường, thiết kế hiện đại, tiết kiệm năng lượng.', now() - interval '3 hours'),
('22222222-2222-2222-2222-222222222222', 'Pin lưu trữ', 'pin-luu-tru', 'Giải pháp lưu trữ điện năng tiên tiến, tuổi thọ cao, đảm bảo cung cấp điện liên tục.', now() - interval '2 hours'),
('33333333-3333-3333-3333-333333333333', 'Điện mặt trời', 'dien-mat-troi', 'Hệ thống điện mặt trời áp mái và công nghiệp, giải pháp năng lượng tái tạo hàng đầu.', now() - interval '1 hour');

-- 3. Thêm dữ liệu sản phẩm mẫu cho các danh mục trên

-- 3.1. Xe điện
INSERT INTO public.products (id, category_id, name, slug, description, price, stock, type, image_url, sku, is_active, is_bestseller) VALUES
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Xe máy điện VinFast Feliz S', 'xe-may-dien-vinfast-feliz-s', 'Xe máy điện VinFast Feliz S thiết kế thanh lịch, tầm hoạt động lên đến 198km mỗi lần sạc.', 29900000, 50, 'XE_DIEN', 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80', 'VF-FELIZ-S', true, true),
(uuid_generate_v4(), '11111111-1111-1111-1111-111111111111', 'Xe máy điện VinFast Klara S', 'xe-may-dien-vinfast-klara-s', 'Xe máy điện thiết kế đậm chất Ý, phù hợp với dân văn phòng, học sinh, sinh viên.', 36900000, 30, 'XE_DIEN', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80', 'VF-KLARA-S', true, false);

-- 3.2. Pin lưu trữ
INSERT INTO public.products (id, category_id, name, slug, description, price, stock, type, image_url, sku, is_active, is_bestseller) VALUES
(uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'Pin lưu trữ Lithium SVE 51.2V-100Ah', 'pin-luu-tru-lithium-sve-100ah', 'Pin Lithium sắt phốt phát (LiFePO4) an toàn, vòng đời cao (6000 chu kỳ), phù hợp cho điện mặt trời.', 25000000, 100, 'PIN_LUU_TRU', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80', 'SVE-512-100', true, true),
(uuid_generate_v4(), '22222222-2222-2222-2222-222222222222', 'Pin lưu trữ điện Gigabox 5E', 'pin-luu-tru-gigabox-5e', 'Dung lượng 5kWh, dễ dàng lắp ráp dạng tủ xếp chồng, tích hợp BMS thông minh.', 28500000, 45, 'PIN_LUU_TRU', 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80', 'GIGA-5E', true, false);

-- 3.3. Điện mặt trời
INSERT INTO public.products (id, category_id, name, slug, description, price, stock, type, image_url, sku, is_active, is_bestseller) VALUES
(uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 'Tấm pin năng lượng mặt trời Jinko 550W', 'tam-pin-mattroi-jinko-550w', 'Tấm pin hiệu suất cao từ Jinko Solar, công nghệ N-Type cho sản lượng điện vượt trội.', 2800000, 500, 'DIEN_MAT_TROI', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JINKO-550', true, true),
(uuid_generate_v4(), '33333333-3333-3333-3333-333333333333', 'Inverter hòa lưới Deye 5kW', 'inverter-hoa-luoi-deye-5kw', 'Bộ biến tần hòa lưới 1 pha Deye, màn hình cảm ứng, theo dõi qua WiFi, bảo hành 5 năm.', 14500000, 20, 'DIEN_MAT_TROI', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', 'DEYE-5K', true, false);
