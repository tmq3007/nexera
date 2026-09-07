-- ==========================================
-- NEXERA DATABASE - COMPLETE UNIFIED SCHEMA
-- Consolidated: 2026-08-29
-- ==========================================
-- File này bao gồm TOÀN BỘ CƠ SỞ DỮ LIỆU của dự án Nexera (16 Bảng).
-- Quy trình: Xóa DB cũ -> Tạo Extension/Type -> Tạo 16 Bảng -> Seed Data -> RLS Policies -> Triggers & Indexes.
-- ==========================================

-- ==========================================
-- PHẦN 0: RESET SCHEMA (DROP TABLES & TYPES)
-- ==========================================

-- Xóa dữ liệu tài khoản auth mặc định nếu có (để tránh xung đột khi seed lại)
DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('admin@nexera.vn', 'customer@nexera.vn')
);
DELETE FROM auth.users WHERE email IN ('admin@nexera.vn', 'customer@nexera.vn');

-- Xóa các hàm helper cũ
DROP FUNCTION IF EXISTS public.has_permission(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Xóa 16 bảng theo thứ tự khóa ngoại
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.policy_versions CASCADE;
DROP TABLE IF EXISTS public.policies CASCADE;
DROP TABLE IF EXISTS public.business_information CASCADE;
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

-- Xóa Type Enum
DROP TYPE IF EXISTS public.policy_type CASCADE;

-- ==========================================
-- PHẦN 1: EXTENSIONS & CUSTOM TYPES
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum cho loại chính sách (Ministry of Industry and Trade Compliance)
DO $$ BEGIN
    CREATE TYPE public.policy_type AS ENUM (
        'PRIVACY_POLICY',
        'SHIPPING_POLICY',
        'RETURN_REFUND_POLICY',
        'PAYMENT_POLICY',
        'TERMS_OF_SERVICE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- PHẦN 2: TẠO 16 BẢNG (TABLE DEFINITIONS)
-- ==========================================

-- 1. ROLES
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.roles IS 'Định nghĩa vai trò hệ thống. is_system=true không được xóa.';

-- 2. PERMISSIONS
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  module text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.permissions IS 'Danh sách quyền hạn chi tiết theo module (module.action).';

-- 3. ROLE_PERMISSIONS
CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_unique UNIQUE(role_id, permission_id)
);
COMMENT ON TABLE public.role_permissions IS 'Liên kết n-n giữa Roles và Permissions.';

-- 4. ADMIN_ACCOUNTS
CREATE TABLE public.admin_accounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  auth_user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL,
  role_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT admin_accounts_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT admin_accounts_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.admin_accounts IS 'Tài khoản Admin hệ thống (đăng nhập tại /dang-nhap/admin).';

-- 5. CATEGORIES
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  description text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- 6. ARTICLES
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  image_url text,
  published_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'NEXERA'::text,
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);

-- 7. PROJECTS
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  image_url text,
  completion_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- 8. PRODUCTS
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  type text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now(),
  import_price numeric NOT NULL DEFAULT 0,
  discount_rate numeric NOT NULL DEFAULT 0 CHECK (discount_rate >= 0::numeric AND discount_rate <= 100::numeric),
  sale_start_date timestamp with time zone,
  sale_end_date timestamp with time zone,
  sku text UNIQUE,
  brand text,
  supplier text,
  origin text,
  warranty_info text,
  specifications jsonb DEFAULT '{}'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  gallery text[] DEFAULT '{}'::text[],
  is_bestseller boolean DEFAULT false,
  restock_date timestamp with time zone,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- 9. CUSTOMERS
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text,
  phone text,
  address text,
  avatar_url text,
  auth_user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 10. ORDERS
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING'::text,
  payment_method text,
  payos_order_code text,
  created_at timestamp with time zone DEFAULT now(),
  note text,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL
);

-- 11. ORDER_ITEMS
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid,
  product_id uuid,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

-- 12. LEADS
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'NEW'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);

-- 13. BUSINESS_INFORMATION
CREATE TABLE public.business_information (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name character varying NOT NULL DEFAULT 'CÔNG TY CỔ PHẦN TẬP ĐOÀN NEXERA'::character varying,
  tax_code character varying NOT NULL DEFAULT '0109999999'::character varying,
  address text NOT NULL DEFAULT 'Hà Nội, Việt Nam'::text,
  phone character varying NOT NULL DEFAULT '0123.456.789'::character varying,
  email character varying NOT NULL DEFAULT 'contact@nexera.com'::character varying,
  website character varying DEFAULT 'https://nexerasolar.com'::character varying,
  representative character varying DEFAULT 'Đại diện theo pháp luật'::character varying,
  license_issued_date character varying DEFAULT 'Ngày cấp: 01/01/2026'::character varying,
  license_issued_by character varying DEFAULT 'Sở Kế hoạch và Đầu tư TP. Hà Nội'::character varying,
  map_url text DEFAULT 'https://maps.google.com/?q=Hà+Nội,+Việt+Nam'::text,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid,
  CONSTRAINT business_information_pkey PRIMARY KEY (id),
  CONSTRAINT business_information_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 14. POLICIES
CREATE TABLE public.policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type public.policy_type NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  summary text,
  is_active boolean DEFAULT true,
  current_version_id uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT policies_pkey PRIMARY KEY (id)
);

-- 15. POLICY_VERSIONS
CREATE TABLE public.policy_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL,
  version character varying NOT NULL DEFAULT 'v1.0'::character varying,
  content text NOT NULL,
  effective_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_by uuid,
  CONSTRAINT policy_versions_pkey PRIMARY KEY (id),
  CONSTRAINT policy_versions_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.policies(id) ON DELETE CASCADE,
  CONSTRAINT policy_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT unique_policy_version UNIQUE(policy_id, version)
);

-- Khóa ngoại vòng cho current_version_id trong bảng policies
ALTER TABLE public.policies
  ADD CONSTRAINT fk_policies_current_version FOREIGN KEY (current_version_id) REFERENCES public.policy_versions(id) ON DELETE SET NULL;

-- 16. ACTIVITY_LOGS
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  severity text NOT NULL DEFAULT 'INFO'::text CHECK (severity = ANY (ARRAY['INFO'::text, 'WARNING'::text, 'ERROR'::text, 'CRITICAL'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_accounts(id) ON DELETE SET NULL
);

-- ==========================================
-- PHẦN 3: HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Helper kiểm tra vai trò admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_accounts WHERE auth_user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper kiểm tra super admin
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

-- Helper kiểm tra quyền RBAC cụ thể
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

-- Function cập nhật cột updated_at tự động
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers tự động cập nhật updated_at
CREATE TRIGGER set_updated_at_admin_accounts
    BEFORE UPDATE ON public.admin_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_business_info
    BEFORE UPDATE ON public.business_information
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_policies
    BEFORE UPDATE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function tự động tạo Customer profile khi đăng ký (bỏ qua nếu là Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
-- PHẦN 4: INDEXES OPTIMIZATION
-- ==========================================

CREATE INDEX idx_admin_accounts_auth_user_id ON public.admin_accounts(auth_user_id);
CREATE INDEX idx_admin_accounts_role_id ON public.admin_accounts(role_id);
CREATE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_permissions_module ON public.permissions(module);

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs (entity_type);
CREATE INDEX idx_activity_logs_action ON public.activity_logs (action);
CREATE INDEX idx_activity_logs_admin_id ON public.activity_logs (admin_id);
CREATE INDEX idx_activity_logs_severity ON public.activity_logs (severity);

-- ==========================================
-- PHẦN 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Bật RLS cho tất cả 16 bảng
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
ALTER TABLE public.business_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (Giao diện công khai Storefront)
CREATE POLICY "Public đọc categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public đọc articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Public đọc projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public đọc products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public gửi yêu cầu tư vấn leads" ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Public đọc thông tin doanh nghiệp" ON public.business_information FOR SELECT TO public USING (true);
CREATE POLICY "Public đọc chính sách active" ON public.policies FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Public đọc phiên bản chính sách" ON public.policy_versions FOR SELECT TO public USING (true);

-- 2. Customer Policies
CREATE POLICY "Customer đọc thông tin cá nhân" ON public.customers FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Customer sửa thông tin cá nhân" ON public.customers FOR UPDATE USING (auth.uid() = auth_user_id);

-- 3. RBAC Policies for Admins
CREATE POLICY "Admin đọc roles" ON public.roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin đọc permissions" ON public.permissions FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin đọc role_permissions" ON public.role_permissions FOR SELECT USING (public.is_admin());

CREATE POLICY "Super Admin quản lý roles" ON public.roles FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super Admin quản lý permissions" ON public.permissions FOR ALL USING (public.is_super_admin());
CREATE POLICY "Super Admin quản lý role_permissions" ON public.role_permissions FOR ALL USING (public.is_super_admin());

CREATE POLICY "Admin đọc tài khoản admin cá nhân" ON public.admin_accounts FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Super Admin quản lý tất cả admin accounts" ON public.admin_accounts FOR ALL USING (public.is_super_admin());

-- 4. Admin Management Policies (Categories, Products, Articles, Projects, Orders, Leads, Business Info, Policies, Activity Logs)
CREATE POLICY "Admin quản lý categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý products" ON public.products FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý articles" ON public.articles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý orders" ON public.orders FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý order_items" ON public.order_items FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý leads" ON public.leads FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý customers" ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý business_information" ON public.business_information FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý policies" ON public.policies FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin quản lý policy_versions" ON public.policy_versions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated ghi activity_logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin xem activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.is_admin());

-- ==========================================
-- PHẦN 6: SEED INITIAL DATA
-- ==========================================

-- 6.1 SEED ROLES
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Quản trị viên cấp cao', 'Toàn quyền hệ thống, quản lý tài khoản admin và phân quyền.', true),
  ('editor',      'Biên tập viên',         'Quản lý nội dung: sản phẩm, bài viết, dự án, danh mục.', true),
  ('sales',       'Nhân viên kinh doanh',  'Quản lý đơn hàng, khách hàng, yêu cầu tư vấn (leads).', true);

-- 6.2 SEED PERMISSIONS
INSERT INTO public.permissions (name, display_name, module, description) VALUES
  ('dashboard.view',      'Xem tổng quan',            'dashboard', 'Xem bảng điều khiển chính'),
  ('products.read',       'Xem sản phẩm',             'products',  'Xem danh sách sản phẩm'),
  ('products.write',      'Thêm/sửa sản phẩm',       'products',  'Tạo mới hoặc chỉnh sửa sản phẩm'),
  ('products.delete',     'Xóa sản phẩm',             'products',  'Xóa sản phẩm khỏi hệ thống'),
  ('categories.read',     'Xem danh mục',             'categories','Xem danh mục sản phẩm'),
  ('categories.write',    'Thêm/sửa danh mục',        'categories','Tạo mới hoặc chỉnh sửa danh mục'),
  ('categories.delete',   'Xóa danh mục',             'categories','Xóa danh mục'),
  ('orders.read',         'Xem đơn hàng',             'orders',    'Xem danh sách đơn hàng'),
  ('orders.manage',       'Cập nhật trạng thái đơn',  'orders',    'Xử lý và cập nhật đơn hàng'),
  ('customers.read',      'Xem khách hàng',           'customers', 'Xem danh sách khách hàng'),
  ('customers.write',     'Sửa thông tin khách hàng', 'customers', 'Cập nhật thông tin khách hàng'),
  ('leads.read',          'Xem yêu cầu tư vấn',      'leads',     'Xem danh sách Form tư vấn'),
  ('leads.manage',        'Xử lý yêu cầu tư vấn',    'leads',     'Cập nhật trạng thái xử lý leads'),
  ('articles.read',       'Xem bài viết',             'articles',  'Xem danh sách tin tức/bài viết'),
  ('articles.write',      'Thêm/sửa bài viết',        'articles',  'Tạo mới hoặc chỉnh sửa bài viết'),
  ('articles.delete',     'Xóa bài viết',             'articles',  'Xóa bài viết'),
  ('projects.read',       'Xem dự án',                'projects',  'Xem danh sách dự án tiêu biểu'),
  ('projects.write',      'Thêm/sửa dự án',           'projects',  'Tạo mới hoặc chỉnh sửa dự án'),
  ('projects.delete',     'Xóa dự án',                'projects',  'Xóa dự án'),
  ('admin.manage_users',  'Quản lý tài khoản admin',  'admin',     'Tạo/sửa/vô hiệu hóa admin'),
  ('admin.manage_roles',  'Quản lý vai trò & quyền',  'admin',     'Phân quyền và tạo role mới'),
  ('admin.settings',      'Cài đặt hệ thống',         'admin',     'Cấu hình chính sách & doanh nghiệp'),
  ('logs.read',           'Xem Nhật Ký Hoạt Động',    'logs',      'Cho phép xem nhật ký hoạt động hệ thống'),
  ('logs.manage',         'Quản Lý Nhật Ký Hoạt Động','logs',      'Cho phép quản lý nhật ký hoạt động');

-- 6.3 GẮN QUYỀN CHO ROLES
-- Super Admin: Toàn quyền
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'super_admin';

-- Editor
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

-- Sales
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

-- 6.4 TẠO TÀI KHOẢN MẶC ĐỊNH AUTH.USERS (Admin & Customer)
-- Admin: admin@nexera.vn / password: admin
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

INSERT INTO public.admin_accounts (auth_user_id, display_name, role_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nexera Admin',
    (SELECT id FROM public.roles WHERE name = 'super_admin' LIMIT 1),
    true
);

-- Customer: customer@nexera.vn / password: customer
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

INSERT INTO public.customers (full_name, email, phone, address, auth_user_id)
VALUES (
    'Khách Hàng Mặc Định',
    'customer@nexera.vn',
    '0909123456',
    '123 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    '00000000-0000-0000-0000-000000000002'
);

-- 6.5 SEED BUSINESS INFORMATION
INSERT INTO public.business_information (id, business_name, tax_code, address, phone, email, website)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'CÔNG TY CỔ PHẦN TẬP ĐOÀN NEXERA',
    '0109999999',
    'Tầng 12, Tòa nhà Nexera Tower, Hà Nội, Việt Nam',
    '0123.456.789',
    'contact@nexera.com',
    'https://nexerasolar.com'
) ON CONFLICT (id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;

-- 6.6 SEED 5 POLICIES (BỘ CÔNG THƯƠNG COMPLIANCE)
DO $$
DECLARE
    privacy_id UUID := gen_random_uuid();
    shipping_id UUID := gen_random_uuid();
    return_id UUID := gen_random_uuid();
    payment_id UUID := gen_random_uuid();
    terms_id UUID := gen_random_uuid();
    
    privacy_ver_id UUID := gen_random_uuid();
    shipping_ver_id UUID := gen_random_uuid();
    return_ver_id UUID := gen_random_uuid();
    payment_ver_id UUID := gen_random_uuid();
    terms_ver_id UUID := gen_random_uuid();
BEGIN
    -- Privacy Policy
    IF NOT EXISTS (SELECT 1 FROM public.policies WHERE type = 'PRIVACY_POLICY') THEN
        INSERT INTO public.policies (id, type, slug, title, summary, is_active)
        VALUES (privacy_id, 'PRIVACY_POLICY', 'bao-mat', 'Chính sách bảo mật thông tin cá nhân', 'Cam kết bảo vệ thông tin cá nhân của khách hàng theo quy định của pháp luật.', true);

        INSERT INTO public.policy_versions (id, policy_id, version, content)
        VALUES (privacy_ver_id, privacy_id, 'v1.0', 
            '## 1. Mục đích và phạm vi thu thập
Nexera cam kết bảo mật tuyệt đối các thông tin cá nhân của khách hàng khi đăng ký sử dụng dịch vụ hoặc đặt mua sản phẩm trên website.

## 2. Phạm vi sử dụng thông tin
Thông tin thu thập được sử dụng cho mục đích:
- Xử lý đơn hàng và giao hàng cho quý khách.
- Thông báo về việc giao hàng và hỗ trợ khách hàng.
- Cung cấp thông tin liên quan đến sản phẩm, dịch vụ và ưu đãi.');

        UPDATE public.policies SET current_version_id = privacy_ver_id WHERE id = privacy_id;
    END IF;

    -- Shipping Policy
    IF NOT EXISTS (SELECT 1 FROM public.policies WHERE type = 'SHIPPING_POLICY') THEN
        INSERT INTO public.policies (id, type, slug, title, summary, is_active)
        VALUES (shipping_id, 'SHIPPING_POLICY', 'van-chuyen', 'Chính sách vận chuyển & giao nhận', 'Quy định về thời gian, chi phí và phương thức giao hàng toàn quốc.', true);

        INSERT INTO public.policy_versions (id, policy_id, version, content)
        VALUES (shipping_ver_id, shipping_id, 'v1.0', 
            '## 1. Phương thức giao hàng
Nexera hợp tác với các đơn vị vận chuyển uy tín để giao hàng toàn quốc.

## 2. Phí vận chuyển
- Miễn phí vận chuyển cho đơn hàng từ 5.000.000đ trở lên.
- Đơn hàng tiêu chuẩn: Phí giao hàng tính theo biểu phí của đơn vị vận chuyển.');

        UPDATE public.policies SET current_version_id = shipping_ver_id WHERE id = shipping_id;
    END IF;

    -- Return Refund Policy
    IF NOT EXISTS (SELECT 1 FROM public.policies WHERE type = 'RETURN_REFUND_POLICY') THEN
        INSERT INTO public.policies (id, type, slug, title, summary, is_active)
        VALUES (return_id, 'RETURN_REFUND_POLICY', 'doi-tra', 'Chính sách đổi trả & hoàn tiền', 'Quy định điều kiện, thời gian và thủ tục đổi trả sản phẩm lỗi.', true);

        INSERT INTO public.policy_versions (id, policy_id, version, content)
        VALUES (return_ver_id, return_id, 'v1.0', 
            '## 1. Điều kiện đổi trả
Sản phẩm được đổi trả trong vòng 7 ngày kể từ ngày nhận hàng nếu phát sinh lỗi từ nhà sản xuất.

## 2. Quy trình hoàn tiền
Tiền sẽ được hoàn lại qua tài khoản ngân hàng của khách hàng trong vòng 3-5 ngày làm việc.');

        UPDATE public.policies SET current_version_id = return_ver_id WHERE id = return_id;
    END IF;

    -- Payment Policy
    IF NOT EXISTS (SELECT 1 FROM public.policies WHERE type = 'PAYMENT_POLICY') THEN
        INSERT INTO public.policies (id, type, slug, title, summary, is_active)
        VALUES (payment_id, 'PAYMENT_POLICY', 'thanh-toan', 'Chính sách thanh toán', 'Các hình thức thanh toán được hỗ trợ: Chuyển khoản, PayOS, COD.', true);

        INSERT INTO public.policy_versions (id, policy_id, version, content)
        VALUES (payment_ver_id, payment_id, 'v1.0', 
            '## 1. Các hình thức thanh toán
Nexera hỗ trợ các phương thức thanh toán an toàn:
- Chuyển khoản ngân hàng qua cổng thanh toán PayOS (QR Code).
- Thanh toán khi nhận hàng (COD).
- Thanh toán trực tiếp tại văn phòng.');

        UPDATE public.policies SET current_version_id = payment_ver_id WHERE id = payment_id;
    END IF;

    -- Terms of Service
    IF NOT EXISTS (SELECT 1 FROM public.policies WHERE type = 'TERMS_OF_SERVICE') THEN
        INSERT INTO public.policies (id, type, slug, title, summary, is_active)
        VALUES (terms_id, 'TERMS_OF_SERVICE', 'dieu-khoan', 'Điều khoản sử dụng dịch vụ', 'Quy định quyền và nghĩa vụ của khách hàng và Nexera khi giao dịch.', true);

        INSERT INTO public.policy_versions (id, policy_id, version, content)
        VALUES (terms_ver_id, terms_id, 'v1.0', 
            '## 1. Quy định chung
Khi truy cập và đặt hàng tại Nexera, quý khách đồng ý tuân thủ các điều khoản dịch vụ này.

## 2. Quyền và trách nhiệm
Nexera cam kết cung cấp sản phẩm chính hãng, đầy đủ CO/CQ và bảo hành theo đúng cam kết.');

        UPDATE public.policies SET current_version_id = terms_ver_id WHERE id = terms_id;
    END IF;
END $$;

-- 6.7 SEED CATEGORIES
INSERT INTO public.categories (name, slug, description) VALUES
('Điện Mặt Trời', 'dien-mat-troi', 'Các giải pháp và thiết bị điện năng lượng mặt trời'),
('Biến Tần (Inverter)', 'bien-tan', 'Bộ chuyển đổi điện năng lượng mặt trời'),
('Pin Lưu Trữ', 'pin-luu-tru', 'Hệ thống pin lưu trữ điện năng Lithium'),
('Phần Mềm Quản Lý', 'phan-mem-quan-ly', 'Giải pháp phần mềm chuyển đổi số cho doanh nghiệp');

-- 6.8 SEED PRODUCTS
INSERT INTO public.products (name, slug, category_id, type, price, import_price, discount_rate, stock, description, image_url, sku, brand, origin, warranty_info, specifications, images, is_active, gallery, is_bestseller, restock_date) VALUES
('ẮC QUY ROCKET 12V - 50AH SMF 65B24LS', 'ac-quy-rocket-12v-50ah-smf-65b24ls', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 1650000, 1300000, 5, 50, 'Ắc quy khô kín khí (miễn bảo dưỡng), khởi động động cơ piston cho xe ô tô, tàu thuyền.', 'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80', 'Rocket SMF 65B24LS', 'Rocket', 'Hàn Quốc', '9 tháng', '{"Điện áp": "12V", "Dung lượng": "50Ah", "CCA": "450CCA", "Công nghệ": "Lead-Acid"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=800&q=80'], false, NULL),
('ẮC QUY VARTA 12V - 75AH 100D26R', 'ac-quy-varta-12v-75ah-100d26r', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 2055000, 1500000, 11, 0, 'Ắc quy Varta dòng Silver Dynamic cao cấp.', 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80', 'VT100D26R', 'Varta', 'Hàn Quốc', '9 tháng', '{"Điện áp": "12V", "Dung lượng": "75AH"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&q=80'], true, NOW() + INTERVAL '15 days'),
('Pin Lưu Trữ Lithium UFO 5kWh', 'pin-luu-tru-lithium-ufo-5kwh', (SELECT id FROM categories WHERE slug = 'pin-luu-tru' LIMIT 1), 'EQUIPMENT', 22000000, 17000000, 5, 35, 'Pin Lithium gắn tường 48V 100Ah vòng đời 6000 lần sạc.', 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80', 'UFO-5KWH', 'UFO Power', 'Đài Loan', '5 năm', '{"Điện áp": "48V", "Dung lượng": "100Ah", "Loại Pin": "LiFePO4"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800&q=80'], true, NULL),
('Tấm Pin Jinko 550W', 'tam-pin-jinko-550w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2500000, 2000000, 10, 150, 'Tấm pin Jinko Solar hiệu suất cao.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'JK550-N', 'Jinko Solar', 'Trung Quốc', '25 năm hiệu suất', '{"Công suất": "550W", "Hiệu suất": "21.3%", "Loại Cell": "Mono N-type"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'], true, NULL),
('Tấm Pin Canadian Solar 450W', 'tam-pin-canadian-450w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2100000, 1800000, 5, 200, 'Tấm pin công suất tiêu chuẩn cho gia đình.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'CS-450', 'Canadian Solar', 'Canada', '10 năm', '{"Công suất": "450W", "Hiệu suất": "20.5%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80'], false, NULL),
('Tấm Pin LONGi 540W', 'tam-pin-longi-540w', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'EQUIPMENT', 2450000, 2100000, 0, 120, 'Tấm pin LONGi đơn tinh thể.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', 'LG-540', 'LONGi', 'Trung Quốc', '12 năm', '{"Công suất": "540W", "Hiệu suất": "21.1%"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'], false, NULL),
('Biến Tần Hybrid Deye 8kW', 'bien-tan-hybrid-deye-8kw', (SELECT id FROM categories WHERE slug = 'bien-tan' LIMIT 1), 'EQUIPMENT', 35000000, 28000000, 0, 20, 'Inverter Hybrid Deye 8kW 1 pha.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80', 'DEYE-8K', 'Deye', 'Trung Quốc', '5 năm', '{"Công suất AC": "8000W", "Pha": "1 Pha"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80'], true, NULL),
('Hệ Thống ĐMT Áp Mái 5kWp', 'he-thong-dien-mat-troi-ap-mai-5kwp', (SELECT id FROM categories WHERE slug = 'dien-mat-troi' LIMIT 1), 'PACKAGE', 65000000, 50000000, 0, 5, 'Trọn gói lắp đặt 5kWp cho hộ gia đình.', 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80', 'PKG-5KWP', 'Nexera', 'Việt Nam', '2 năm trọn gói', '{"Quy mô": "Hộ gia đình", "Sản lượng": "600-700 kWh/tháng"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80'], true, NULL),
('Phần Mềm Quản Lý Kho N-WMS', 'phan-mem-quan-ly-kho-bai-n-wms', (SELECT id FROM categories WHERE slug = 'phan-mem-quan-ly' LIMIT 1), 'PACKAGE', 15000000, 5000000, 20, 999, 'Giải pháp quản lý kho thông minh tích hợp IoT.', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', 'SFT-NWMS', 'Nexera Tech', 'Việt Nam', '12 tháng', '{"Nền tảng": "Web/Mobile App"}'::jsonb, '[{"url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", "is_primary": true}]'::jsonb, true, ARRAY['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'], false, NULL);

-- 6.9 SEED SAMPLE CUSTOMERS
INSERT INTO public.customers (full_name, phone, email, address) VALUES
('Nguyễn Văn An', '0901234567', 'an.nguyen@example.com', '123 Nguyễn Văn Linh, Quận 7, TP.HCM'),
('Trần Thị Bình', '0987654321', 'binh.tran@example.com', '45 Lê Duẩn, Quận 1, TP.HCM'),
('Công ty TNHH ABC', '0283456789', 'contact@abc.vn', 'KCN Sóng Thần, Bình Dương');

-- 6.10 SEED SAMPLE ORDERS
INSERT INTO public.orders (customer_id, status, total_amount, note) VALUES
((SELECT id FROM customers WHERE email = 'customer@nexera.vn' LIMIT 1), 'COMPLETED', 22000000, 'Giao hàng tận nơi - Đã thanh toán PayOS'),
((SELECT id FROM customers WHERE email = 'customer@nexera.vn' LIMIT 1), 'PROCESSING', 2500000, 'Đã cọc 50% qua chuyển khoản'),
((SELECT id FROM customers WHERE email = 'an.nguyen@example.com' LIMIT 1), 'COMPLETED', 65000000, 'Lắp đặt vào cuối tuần');

-- 6.11 SEED SAMPLE ORDER ITEMS
INSERT INTO public.order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
((SELECT id FROM orders WHERE note = 'Giao hàng tận nơi - Đã thanh toán PayOS' LIMIT 1), (SELECT id FROM products WHERE slug = 'pin-luu-tru-lithium-ufo-5kwh' LIMIT 1), 1, 22000000, 22000000),
((SELECT id FROM orders WHERE note = 'Đã cọc 50% qua chuyển khoản' LIMIT 1), (SELECT id FROM products WHERE slug = 'tam-pin-jinko-550w' LIMIT 1), 1, 2500000, 2500000),
((SELECT id FROM orders WHERE note = 'Lắp đặt vào cuối tuần' LIMIT 1), (SELECT id FROM products WHERE slug = 'he-thong-dien-mat-troi-ap-mai-5kwp' LIMIT 1), 1, 65000000, 65000000);

-- 6.12 SEED SAMPLE LEADS
INSERT INTO public.leads (name, phone, email, message, status) VALUES
('Lê Hoàng Khang', '0933112233', 'khang.le@gmail.com', 'Tôi muốn tư vấn hệ thống ĐMT 10kW cho nhà xưởng', 'NEW'),
('Phạm Thị Dung', '0911445566', '', 'Báo giá pin lưu trữ', 'CONTACTED'),
('Đặng Thái Sơn', '0988776655', 'son.dang@outlook.com', 'Tư vấn phần mềm quản lý kho', 'RESOLVED');

-- 6.13 SEED SAMPLE ARTICLES
INSERT INTO public.articles (title, slug, content, image_url, published_at) VALUES
('5 Lợi ích khi lắp đặt ĐMT cho doanh nghiệp', '5-loi-ich-dien-mat-troi-doanh-nghiep', 'Điện mặt trời giúp doanh nghiệp tiết kiệm chi phí, đạt chứng chỉ xanh...', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80', NOW() - INTERVAL '2 days'),
('Xu hướng chuyển đổi số năm 2026', 'xu-huong-chuyen-doi-so-2026', 'AI và IoT tiếp tục dẫn đầu trong công cuộc chuyển đổi số...', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80', NOW() - INTERVAL '10 days');

-- 6.14 SEED SAMPLE PROJECTS
INSERT INTO public.projects (name, category, description, image_url, completion_date) VALUES
('Dự án ĐMT 1MWp - KCN Amata', 'INDUSTRIAL', 'Lắp đặt 1MWp cho nhà máy dệt may, giảm 30% chi phí điện.', 'https://images.unsplash.com/photo-1611273426858-450d8e3c9cce?w=800&q=80', '2026-05-15'),
('Smart Home Villa Quận 2', 'RESIDENTIAL', 'Tích hợp ĐMT, pin lưu trữ và điều khiển thông minh.', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80', '2026-08-01');

-- ==========================================
-- HOÀN TẤT SCHEMA HỢP NHẤT DỰ ÁN NEXERA (16 BẢNG)
-- Chạy duy nhất file này trong Supabase SQL Editor để thiết lập hoàn chỉnh DB.
-- ==========================================
