-- ==========================================
-- NEXERA DATABASE - COMPLETE SCHEMA (RESET & REBUILD)
-- Phiên bản: 2026-08-25
-- ==========================================
-- File này XÓA TOÀN BỘ DB cũ rồi tạo lại từ đầu.
-- Bao gồm: DROP → CREATE → RBAC → RLS → Seed Data → Dump Data.
-- ==========================================

-- ==========================================
-- PHẦN 0: XÓA TOÀN BỘ DỮ LIỆU VÀ BẢNG CŨ
-- ==========================================

-- Xóa dữ liệu auth (identities trước, users sau)
DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('admin@nexera.vn', 'customer@nexera.vn')
);
DELETE FROM auth.users WHERE email IN ('admin@nexera.vn', 'customer@nexera.vn');

-- Xóa hàm helper nếu tồn tại
DROP FUNCTION IF EXISTS public.has_permission(TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Xóa tất cả bảng (theo thứ tự khóa ngoại)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.articles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.admin_accounts CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- ==========================================
-- BẮT ĐẦU TẠO LẠI SCHEMA
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- PHẦN 1: RBAC (Role-Based Access Control)
-- ==========================================

-- 1.1 ROLES - Định nghĩa vai trò
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Định nghĩa các vai trò trong hệ thống. is_system=true là role mặc định không được phép xóa.';

-- 1.2 PERMISSIONS - Định nghĩa quyền hạn
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    module TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.permissions IS 'Danh sách quyền hạn chi tiết theo từng module. Naming: module.action (vd: products.write).';

-- 1.3 ROLE_PERMISSIONS - Liên kết vai trò với quyền hạn (Many-to-Many)
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Bảng trung gian gắn quyền (permissions) vào vai trò (roles).';

-- 1.4 ADMIN_ACCOUNTS - Quản lý tài khoản quản trị viên
CREATE TABLE public.admin_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.admin_accounts IS 'Tài khoản Admin. Chỉ user có record ở đây VÀ is_active=true mới được truy cập /admin.';

-- ==========================================
-- PHẦN 2: CMS & NỘI DUNG (Public Read)
-- ==========================================

-- 2.1 CATEGORIES - Danh mục sản phẩm
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- 2.2 ARTICLES - Bài viết / Tin tức
CREATE TABLE public.articles (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    image_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT DEFAULT 'NEXERA'::text,
    CONSTRAINT articles_pkey PRIMARY KEY (id)
);

-- 2.3 PROJECTS - Dự án tiêu biểu
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    completion_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- ==========================================
-- PHẦN 3: E-COMMERCE (Bán hàng)
-- ==========================================

-- 3.1 PRODUCTS - Sản phẩm
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    category_id UUID,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    import_price NUMERIC NOT NULL DEFAULT 0,
    discount_rate NUMERIC NOT NULL DEFAULT 0 CHECK (discount_rate >= 0::numeric AND discount_rate <= 100::numeric),
    sale_start_date TIMESTAMPTZ,
    sale_end_date TIMESTAMPTZ,
    sku TEXT UNIQUE,
    brand TEXT,
    supplier TEXT,
    origin TEXT,
    warranty_info TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT products_pkey PRIMARY KEY (id),
    CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- ==========================================
-- PHẦN 4: CRM & ĐƠN HÀNG
-- ==========================================

-- 4.1 CUSTOMERS - Khách hàng
CREATE TABLE public.customers (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    avatar_url TEXT,
    auth_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT customers_pkey PRIMARY KEY (id),
    CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.2 ORDERS - Đơn hàng
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    customer_id UUID,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING'::text,
    payment_method TEXT,
    payos_order_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    note TEXT,
    CONSTRAINT orders_pkey PRIMARY KEY (id),
    CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

-- 4.3 ORDER_ITEMS - Chi tiết đơn hàng
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    order_id UUID,
    product_id UUID,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_price NUMERIC,
    CONSTRAINT order_items_pkey PRIMARY KEY (id),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

-- 4.4 LEADS - Yêu cầu tư vấn (CRM)
CREATE TABLE public.leads (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'NEW'::text,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT leads_pkey PRIMARY KEY (id)
);

-- ==========================================
-- PHẦN 5: SEED - Dữ liệu mặc định RBAC
-- ==========================================

-- Roles mặc định
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Quản trị viên cấp cao', 'Toàn quyền hệ thống, quản lý tài khoản admin và phân quyền.', true),
  ('editor',      'Biên tập viên',         'Quản lý nội dung: sản phẩm, bài viết, dự án, danh mục.', true),
  ('sales',       'Nhân viên kinh doanh',  'Quản lý đơn hàng, khách hàng, yêu cầu tư vấn (leads).', true);

-- Permissions mặc định
INSERT INTO public.permissions (name, display_name, module) VALUES
  ('dashboard.view',      'Xem tổng quan',            'dashboard'),
  ('products.read',       'Xem sản phẩm',             'products'),
  ('products.write',      'Thêm/sửa sản phẩm',       'products'),
  ('products.delete',     'Xóa sản phẩm',             'products'),
  ('categories.read',     'Xem danh mục',             'categories'),
  ('categories.write',    'Thêm/sửa danh mục',        'categories'),
  ('categories.delete',   'Xóa danh mục',             'categories'),
  ('orders.read',         'Xem đơn hàng',             'orders'),
  ('orders.manage',       'Cập nhật trạng thái đơn',  'orders'),
  ('customers.read',      'Xem khách hàng',           'customers'),
  ('customers.write',     'Sửa thông tin khách hàng', 'customers'),
  ('leads.read',          'Xem yêu cầu tư vấn',      'leads'),
  ('leads.manage',        'Xử lý yêu cầu tư vấn',    'leads'),
  ('articles.read',       'Xem bài viết',             'articles'),
  ('articles.write',      'Thêm/sửa bài viết',        'articles'),
  ('articles.delete',     'Xóa bài viết',             'articles'),
  ('projects.read',       'Xem dự án',                'projects'),
  ('projects.write',      'Thêm/sửa dự án',           'projects'),
  ('projects.delete',     'Xóa dự án',                'projects'),
  ('admin.manage_users',  'Quản lý tài khoản admin',  'admin'),
  ('admin.manage_roles',  'Quản lý vai trò & quyền',  'admin'),
  ('admin.settings',      'Cài đặt hệ thống',         'admin');

-- Gắn quyền cho super_admin (toàn quyền)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin';

-- Gắn quyền cho editor
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'editor'
  AND p.name IN (
    'dashboard.view',
    'products.read', 'products.write', 'products.delete',
    'categories.read', 'categories.write', 'categories.delete',
    'articles.read', 'articles.write', 'articles.delete',
    'projects.read', 'projects.write', 'projects.delete'
  );

-- Gắn quyền cho sales
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'sales'
  AND p.name IN (
    'dashboard.view',
    'orders.read', 'orders.manage',
    'customers.read', 'customers.write',
    'leads.read', 'leads.manage',
    'products.read'
  );

-- ==========================================
-- PHẦN 6: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Bật RLS cho tất cả bảng
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- === Public Read (Storefront) ===
CREATE POLICY "Cho phép tất cả đọc categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Cho phép khách tạo leads" ON public.leads FOR INSERT WITH CHECK (true);

-- === Helper Functions for RLS ===
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_accounts WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_accounts aa
    JOIN public.roles r ON aa.role_id = r.id
    WHERE aa.auth_user_id = auth.uid() AND r.name = 'super_admin' AND aa.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- === RBAC Tables (Admin only) ===
CREATE POLICY "Admin đọc roles" ON public.roles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin đọc permissions" ON public.permissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin đọc role_permissions" ON public.role_permissions
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Super Admin quản lý roles" ON public.roles
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Super Admin quản lý permissions" ON public.permissions
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Super Admin quản lý role_permissions" ON public.role_permissions
  FOR ALL USING (public.is_super_admin());

-- === Admin Accounts ===
CREATE POLICY "Admin đọc thông tin của mình" ON public.admin_accounts
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Super Admin quản lý tài khoản admin" ON public.admin_accounts
  FOR ALL USING (public.is_super_admin());

-- === Customers ===
CREATE POLICY "Customer đọc thông tin của mình" ON public.customers
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Customer sửa thông tin của mình" ON public.customers
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin đọc tất cả customers" ON public.customers
  FOR SELECT USING (public.is_admin());

-- === Content & E-commerce Admin CRUD Policies ===
CREATE POLICY "Admin quản lý categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý articles" ON public.articles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý order_items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý leads" ON public.leads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý customers" ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==========================================
-- PHẦN 7: TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_admin_accounts ON public.admin_accounts;
CREATE TRIGGER set_updated_at_admin_accounts
    BEFORE UPDATE ON public.admin_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customers ON public.customers;
CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tự động tạo Customer profile khi có user mới đăng ký (bỏ qua nếu là Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu user là admin, không tự tạo profile customer
  IF EXISTS (SELECT 1 FROM public.admin_accounts WHERE auth_user_id = NEW.id) OR NEW.email LIKE '%admin%' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.customers (auth_user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- PHẦN 8: INDEXES
-- ==========================================

CREATE INDEX idx_admin_accounts_auth_user_id ON public.admin_accounts(auth_user_id);
CREATE INDEX idx_admin_accounts_role_id ON public.admin_accounts(role_id);
CREATE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_permissions_module ON public.permissions(module);

-- ==========================================
-- PHẦN 9: HELPER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_accounts aa
    JOIN public.role_permissions rp ON rp.role_id = aa.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE aa.auth_user_id = auth.uid()
      AND aa.is_active = true
      AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.has_permission IS 'Kiểm tra user hiện tại có quyền cụ thể không. Dùng: SELECT has_permission(''products.write'')';

-- ==========================================
-- PHẦN 10: TÀI KHOẢN MẶC ĐỊNH
-- Admin:    admin@nexera.vn / admin       (super_admin)
-- Customer: customer@nexera.vn / customer (khách hàng)
-- ==========================================

-- Tạo tài khoản Admin trong auth.users
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, is_super_admin, is_sso_user, phone
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@nexera.vn',
    crypt('admin', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nexera Admin"}'::jsonb,
    'authenticated', 'authenticated',
    NOW(), NOW(), '', '', '', '', false, false, NULL
);

-- Identity cho Admin
INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@nexera.vn"}'::jsonb,
    'email', '00000000-0000-0000-0000-000000000001',
    NOW(), NOW(), NOW()
);

-- Liên kết Admin → admin_accounts (super_admin)
INSERT INTO public.admin_accounts (auth_user_id, display_name, role_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nexera Admin',
    (SELECT id FROM public.roles WHERE name = 'super_admin'),
    true
);

-- Xóa khỏi bảng customers nếu trigger tự động chèn admin vào customers
DELETE FROM public.customers WHERE email = 'admin@nexera.vn' OR auth_user_id = '00000000-0000-0000-0000-000000000001';

-- Tạo tài khoản Customer trong auth.users
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change, is_super_admin, is_sso_user, phone
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'customer@nexera.vn',
    crypt('customer', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Khách Hàng Mặc Định"}'::jsonb,
    'authenticated', 'authenticated',
    NOW(), NOW(), '', '', '', '', false, false, NULL
);

-- Identity cho Customer
INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"customer@nexera.vn"}'::jsonb,
    'email', '00000000-0000-0000-0000-000000000002',
    NOW(), NOW(), NOW()
);

-- Liên kết Customer → customers
INSERT INTO public.customers (full_name, email, phone, address, auth_user_id)
VALUES (
    'Khách Hàng Mặc Định',
    'customer@nexera.vn',
    '0909123456',
    '123 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    '00000000-0000-0000-0000-000000000002'
);

-- ==========================================
-- PHẦN 11: DUMP DATA (Dữ liệu mẫu)
-- ==========================================

-- 11.1 CATEGORIES
INSERT INTO public.categories (name, slug, description) VALUES
('Điện Mặt Trời', 'dien-mat-troi', 'Các giải pháp và thiết bị điện năng lượng mặt trời'),
('Biến Tần (Inverter)', 'bien-tan', 'Bộ chuyển đổi điện năng lượng mặt trời'),
('Pin Lưu Trữ', 'pin-luu-tru', 'Hệ thống pin lưu trữ điện năng Lithium'),
('Phần Mềm Quản Lý', 'phan-mem-quan-ly', 'Giải pháp phần mềm chuyển đổi số cho doanh nghiệp');

-- 11.2 PRODUCTS
INSERT INTO public.products (name, slug, category_id, type, price, import_price, discount_rate, stock, description, image_url, sku, brand, origin, warranty_info, specifications, images) VALUES
('ẮC QUY ROCKET 12V - 50AH SMF 65B24LS', 'ac-quy-rocket-12v-50ah-smf-65b24ls', (SELECT id FROM categories WHERE slug = 'pin-luu-tru'), 'EQUIPMENT', 1650000, 1300000, 5, 50, 'Ắc quy khô kín khí (miễn bảo dưỡng), khởi động động cơ piston cho xe ô tô, tàu thuyền.', 'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80', 'Rocket SMF 65B24LS', 'Rocket', 'Hàn Quốc', '9 tháng', '{"Điện áp": "12V", "Dung lượng": "50Ah", "CCA": "450CCA", "Công nghệ": "Lead-Acid"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80", "is_primary": true}]'::jsonb),
('ẮC QUY VARTA 12V - 75AH 100D26R', 'ac-quy-varta-12v-75ah-100d26r', (SELECT id FROM categories WHERE slug = 'pin-luu-tru'), 'EQUIPMENT', 2055000, 1500000, 11, 30, 'Ắc quy Varta dòng Silver Dynamic cao cấp.', 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80', 'VT100D26R', 'Varta', 'Hàn Quốc', '9 tháng', '{"Điện áp": "12V", "Dung lượng": "75AH"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80", "is_primary": true}]'::jsonb),
('Pin Lưu Trữ Lithium UFO 5kWh', 'pin-luu-tru-lithium-ufo-5kwh', (SELECT id FROM categories WHERE slug = 'pin-luu-tru'), 'EQUIPMENT', 22000000, 17000000, 5, 35, 'Pin Lithium gắn tường 48V 100Ah vòng đời 6000 lần sạc.', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80', 'UFO-5KWH', 'UFO Power', 'Đài Loan', '5 năm', '{"Điện áp": "48V", "Dung lượng": "100Ah", "Loại Pin": "LiFePO4"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin Jinko 550W', 'tam-pin-jinko-550w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2500000, 2000000, 10, 150, 'Tấm pin Jinko Solar hiệu suất cao.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JK550-N', 'Jinko Solar', 'Trung Quốc', '25 năm hiệu suất', '{"Công suất": "550W", "Hiệu suất": "21.3%", "Loại Cell": "Mono N-type"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin Canadian Solar 450W', 'tam-pin-canadian-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2100000, 1800000, 5, 200, 'Tấm pin công suất tiêu chuẩn cho gia đình.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'CS-450', 'Canadian Solar', 'Canada', '10 năm', '{"Công suất": "450W", "Hiệu suất": "20.5%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin LONGi 540W', 'tam-pin-longi-540w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2450000, 2100000, 0, 120, 'Tấm pin LONGi đơn tinh thể.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'LG-540', 'LONGi', 'Trung Quốc', '12 năm', '{"Công suất": "540W", "Hiệu suất": "21.1%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin Trina Solar 500W', 'tam-pin-trina-500w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2300000, 1950000, 10, 80, 'Trina Solar 500W chất lượng cao.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'TR-500', 'Trina', 'Trung Quốc', '10 năm', '{"Công suất": "500W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin JA Solar 545W', 'tam-pin-ja-545w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2480000, 2150000, 0, 50, 'JA Solar hiệu năng vượt trội.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JA-545', 'JA Solar', 'Trung Quốc', '12 năm', '{"Công suất": "545W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin AE Solar 450W', 'tam-pin-ae-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2150000, 1850000, 0, 45, 'AE Solar nhập khẩu châu Âu.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'AE-450', 'AE Solar', 'Đức', '15 năm', '{"Công suất": "450W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin Risen 500W', 'tam-pin-risen-500w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2250000, 1900000, 15, 60, 'Risen Energy tiết kiệm chi phí.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'RS-500', 'Risen', 'Trung Quốc', '10 năm', '{"Công suất": "500W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin Qcells 480W', 'tam-pin-qcells-480w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2400000, 2000000, 5, 0, 'Hanwha Qcells bền bỉ.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'QC-480', 'Qcells', 'Hàn Quốc', '12 năm', '{"Công suất": "480W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin SunPower 400W', 'tam-pin-sunpower-400w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 3000000, 2500000, 0, 10, 'SunPower Maxeon cao cấp.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'SP-400', 'SunPower', 'Mỹ', '25 năm', '{"Công suất": "400W", "Hiệu suất": "22.6%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb),
('Tấm Pin VSUN 450W', 'tam-pin-vsun-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'EQUIPMENT', 2050000, 1750000, 10, 200, 'VSUN sản xuất tại Việt Nam.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'VS-450', 'VSUN', 'Việt Nam', '12 năm', '{"Công suất": "450W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Biến Tần Hybrid Deye 8kW', 'bien-tan-hybrid-deye-8kw', (SELECT id FROM categories WHERE slug = 'bien-tan'), 'EQUIPMENT', 35000000, 28000000, 0, 20, 'Inverter Hybrid Deye 8kW 1 pha.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'DEYE-8K', 'Deye', 'Trung Quốc', '5 năm', '{"Công suất AC": "8000W", "Pha": "1 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb),
('Biến Tần SMA 5kW', 'bien-tan-sma-5kw', (SELECT id FROM categories WHERE slug = 'bien-tan'), 'EQUIPMENT', 45000000, 38000000, 10, 15, 'SMA Sunny Boy cao cấp.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'SMA-5K', 'SMA', 'Đức', '10 năm', '{"Công suất AC": "5000W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb),
('Biến Tần Huawei 10kW', 'bien-tan-huawei-10kw', (SELECT id FROM categories WHERE slug = 'bien-tan'), 'EQUIPMENT', 40000000, 32000000, 5, 25, 'Huawei SUN2000 3 pha.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'HW-10K', 'Huawei', 'Trung Quốc', '5 năm', '{"Công suất AC": "10000W", "Pha": "3 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb),
('Biến Tần Growatt 5kW', 'bien-tan-growatt-5kw', (SELECT id FROM categories WHERE slug = 'bien-tan'), 'EQUIPMENT', 22000000, 18000000, 0, 30, 'Growatt MIN 5000TL-X.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'GW-5K', 'Growatt', 'Trung Quốc', '5 năm', '{"Công suất AC": "5000W"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb),
('Hệ Thống ĐMT Áp Mái 5kWp', 'he-thong-dien-mat-troi-ap-mai-5kwp', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'PACKAGE', 65000000, 50000000, 0, 5, 'Trọn gói lắp đặt 5kWp cho hộ gia đình.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'PKG-5KWP', 'Nexera', 'Việt Nam', '2 năm trọn gói', '{"Quy mô": "Hộ gia đình", "Sản lượng": "600-700 kWh/tháng"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Hệ Thống ĐMT 10kWp', 'he-thong-dien-mat-troi-10kwp', (SELECT id FROM categories WHERE slug = 'dien-mat-troi'), 'PACKAGE', 120000000, 95000000, 10, 2, 'Trọn gói 10kWp 3 pha.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'PKG-10K', 'Nexera', 'Việt Nam', '2 năm', '{"Quy mô": "Biệt thự / Xưởng nhỏ"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb),
('Phần Mềm Quản Lý Kho N-WMS', 'phan-mem-quan-ly-kho-bai-n-wms', (SELECT id FROM categories WHERE slug = 'phan-mem-quan-ly'), 'PACKAGE', 15000000, 5000000, 20, 999, 'Giải pháp quản lý kho thông minh tích hợp IoT.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 'SFT-NWMS', 'Nexera Tech', 'Việt Nam', '12 tháng', '{"Nền tảng": "Web/Mobile App"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "is_primary": true}]'::jsonb),
('Phần Mềm Quản Lý Điện N-EMS', 'phan-mem-quan-ly-dien-n-ems', (SELECT id FROM categories WHERE slug = 'phan-mem-quan-ly'), 'PACKAGE', 25000000, 8000000, 0, 999, 'Hệ thống giám sát điện năng IoT.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 'SFT-NEMS', 'Nexera Tech', 'Việt Nam', '1 năm', '{"Nền tảng": "Web/App"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "is_primary": true}]'::jsonb);

-- 11.3 CUSTOMERS (Khách hàng mẫu)
INSERT INTO public.customers (full_name, phone, email, address) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@example.com', '123 Nguyễn Văn Linh, Quận 7, TP.HCM'),
('Trần Thị Bình', '0987654321', 'binh.tran@example.com', '45 Lê Duẩn, Quận 1, TP.HCM'),
('Công ty TNHH ABC', '0283456789', 'contact@abc.vn', 'KCN Sóng Thần, Bình Dương');

-- 11.4 ORDERS (Đơn hàng mẫu)
INSERT INTO public.orders (customer_id, status, total_amount, note) VALUES
((SELECT id FROM customers WHERE email = 'customer@nexera.vn'), 'COMPLETED', 22000000, 'Giao hàng tận nơi - Đã thanh toán PayOS'),
((SELECT id FROM customers WHERE email = 'customer@nexera.vn'), 'PROCESSING', 2500000, 'Đã cọc 50% qua chuyển khoản'),
((SELECT id FROM customers WHERE email = 'an.nguyen@example.com'), 'COMPLETED', 65000000, 'Lắp đặt vào cuối tuần'),
((SELECT id FROM customers WHERE email = 'binh.tran@example.com'), 'SHIPPED', 2500000, 'Giao giờ hành chính'),
((SELECT id FROM customers WHERE email = 'contact@abc.vn'), 'PENDING', 110000000, 'Cần xuất hóa đơn VAT công ty');

-- 11.5 ORDER_ITEMS
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
((SELECT id FROM orders WHERE note = 'Giao hàng tận nơi - Đã thanh toán PayOS'), (SELECT id FROM products WHERE slug = 'pin-luu-tru-lithium-ufo-5kwh'), 1, 22000000, 22000000),
((SELECT id FROM orders WHERE note = 'Đã cọc 50% qua chuyển khoản'), (SELECT id FROM products WHERE slug = 'tam-pin-jinko-550w'), 1, 2500000, 2500000),
((SELECT id FROM orders WHERE note = 'Lắp đặt vào cuối tuần'), (SELECT id FROM products WHERE slug = 'he-thong-dien-mat-troi-ap-mai-5kwp'), 1, 65000000, 65000000),
((SELECT id FROM orders WHERE note = 'Giao giờ hành chính'), (SELECT id FROM products WHERE slug = 'tam-pin-jinko-550w'), 1, 2500000, 2500000),
((SELECT id FROM orders WHERE note = 'Cần xuất hóa đơn VAT công ty'), (SELECT id FROM products WHERE slug = 'bien-tan-hybrid-deye-8kw'), 2, 35000000, 70000000),
((SELECT id FROM orders WHERE note = 'Cần xuất hóa đơn VAT công ty'), (SELECT id FROM products WHERE slug = 'pin-luu-tru-lithium-ufo-5kwh'), 2, 20000000, 40000000);

-- 11.6 LEADS (Yêu cầu tư vấn mẫu)
INSERT INTO public.leads (name, phone, email, message, status) VALUES
('Lê Hoàng Khang', '0933112233', 'khang.le@gmail.com', 'Tôi muốn tư vấn hệ thống ĐMT 10kW cho nhà xưởng', 'NEW'),
('Phạm Thị Dung', '0911445566', '', 'Báo giá pin lưu trữ', 'CONTACTED'),
('Đặng Thái Sơn', '0988776655', 'son.dang@outlook.com', 'Tư vấn phần mềm quản lý kho', 'RESOLVED');

-- 11.7 ARTICLES (Bài viết mẫu)
INSERT INTO public.articles (title, slug, content, image_url, published_at) VALUES
('5 Lợi ích khi lắp đặt ĐMT cho doanh nghiệp', '5-loi-ich-dien-mat-troi-doanh-nghiep', 'Điện mặt trời giúp doanh nghiệp tiết kiệm chi phí, đạt chứng chỉ xanh...', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', NOW() - INTERVAL '2 days'),
('Xu hướng chuyển đổi số năm 2026', 'xu-huong-chuyen-doi-so-2026', 'AI và IoT tiếp tục dẫn đầu trong công cuộc chuyển đổi số...', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', NOW() - INTERVAL '10 days');

-- 11.8 PROJECTS (Dự án mẫu)
INSERT INTO public.projects (name, category, description, image_url, completion_date) VALUES
('Dự án ĐMT 1MWp - KCN Amata', 'INDUSTRIAL', 'Lắp đặt 1MWp cho nhà máy dệt may, giảm 30% chi phí điện.', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9cce?w=800&q=80', '2026-05-15'),
('Smart Home Villa Quận 2', 'RESIDENTIAL', 'Tích hợp ĐMT, pin lưu trữ và điều khiển thông minh.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', '2026-08-01');

-- ==========================================
-- HOÀN TẤT. Chạy file này trên Supabase SQL Editor để reset toàn bộ DB.
-- ==========================================
