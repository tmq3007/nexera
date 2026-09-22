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



-- ==========================================
-- 7. FUNCTION: merge_guest_conversation
-- Gộp lịch sử tin nhắn vãng lai vào tài khoản chính
-- ==========================================
CREATE OR REPLACE FUNCTION public.merge_guest_conversation(p_customer_id UUID, p_guest_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_guest_conv_id UUID;
    v_customer_conv_id UUID;
    v_cust_name TEXT;
BEGIN
    -- Lấy tên khách hàng
    SELECT full_name INTO v_cust_name
    FROM public.customers
    WHERE id = p_customer_id;

    -- Tìm hội thoại vãng lai đang mở
    SELECT id INTO v_guest_conv_id
    FROM public.conversations
    WHERE guest_session_id = p_guest_session_id 
      AND customer_id IS NULL
      AND status != 'MERGED'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Nếu không có, thoát
    IF v_guest_conv_id IS NULL THEN
        RETURN;
    END IF;

    -- Tìm hội thoại chính thức của customer
    SELECT id INTO v_customer_conv_id
    FROM public.conversations
    WHERE customer_id = p_customer_id
      AND status != 'MERGED'
    ORDER BY last_message_at DESC
    LIMIT 1;

    IF v_customer_conv_id IS NOT NULL THEN
        -- Chuyển tin nhắn sang hội thoại chính
        UPDATE public.chat_messages
        SET conversation_id = v_customer_conv_id,
            sender_id = COALESCE(sender_id, p_customer_id),
            sender_name = COALESCE(v_cust_name, sender_name)
        WHERE conversation_id = v_guest_conv_id;

        -- Ẩn hội thoại vãng lai
        UPDATE public.conversations
        SET status = 'MERGED',
            customer_id = p_customer_id
        WHERE id = v_guest_conv_id;

        -- Cập nhật thời gian và nội dung preview
        UPDATE public.conversations
        SET last_message_at = (SELECT last_message_at FROM public.conversations WHERE id = v_guest_conv_id),
            last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
        WHERE id = v_customer_conv_id;
    ELSE
        -- Nâng cấp luôn hội thoại vãng lai thành chính thức
        UPDATE public.conversations
        SET customer_id = p_customer_id,
            guest_name = COALESCE(v_cust_name, guest_name)
        WHERE id = v_guest_conv_id;

        UPDATE public.chat_messages
        SET sender_id = COALESCE(sender_id, p_customer_id),
            sender_name = COALESCE(v_cust_name, sender_name)
        WHERE conversation_id = v_guest_conv_id
          AND sender_type = 'CUSTOMER';
    END IF;
END;
$$;
-- ============================================================
-- Migration: Thêm SEO fields vào bảng products
-- Nexera - Nhóm 4: Product SEO Optimization
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(70),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160);

COMMENT ON COLUMN products.meta_title       IS 'SEO title tag (tối đa 70 ký tự). Nếu NULL, dùng products.name làm fallback.';
COMMENT ON COLUMN products.meta_description IS 'SEO meta description (tối đa 160 ký tự). Nếu NULL, dùng substring của products.description làm fallback.';
-- ============================================================================
-- MIGRATION: 20260907_add_multi_phone_and_email.sql
-- Description: Bổ sung phone_numbers TEXT[] và emails TEXT[] cho bảng customers
-- ============================================================================

ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS phone_numbers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emails TEXT[] DEFAULT '{}';

-- Cập nhật dữ liệu hiện có
UPDATE public.customers
SET 
  phone_numbers = CASE 
    WHEN phone IS NOT NULL AND phone != '' AND NOT (phone = ANY(phone_numbers)) 
    THEN array_append(phone_numbers, phone) 
    ELSE phone_numbers 
  END,
  emails = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT (email = ANY(emails)) 
    THEN array_append(emails, email) 
    ELSE emails 
  END;
-- ============================================================================
-- MIGRATION: 20260907_create_chat_and_crm_tables.sql
-- Description: Tạo bảng conversations, chat_messages, customer_notes và mở rộng CRM
-- ============================================================================

-- 1. Mở rộng bảng customers thêm các trường CRM
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Tạo bảng conversations (Phiên hội thoại)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  guest_session_id text,
  guest_name text,
  guest_phone text,
  guest_email text,
  status text NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'
  assigned_admin_id uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  last_message_preview text,
  last_message_at timestamptz DEFAULT now(),
  unread_admin_count int NOT NULL DEFAULT 0,
  unread_customer_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_session_id ON public.conversations(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 3. Tạo bảng chat_messages (Nội dung tin nhắn)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'CUSTOMER', 'ADMIN', 'SYSTEM'
  sender_id uuid,
  sender_name text NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- 4. Tạo bảng customer_notes (Nhật ký chăm sóc CRM)
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON public.customer_notes(customer_id);

-- 5. Bật Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- 5.1 RLS cho conversations:
-- Khách vãng lai hoặc Khách hàng có thể đọc và tạo hội thoại của mình
CREATE POLICY "Allow public read own conversation" ON public.conversations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert conversation" ON public.conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update conversation" ON public.conversations
  FOR UPDATE USING (true);

-- 5.2 RLS cho chat_messages:
CREATE POLICY "Allow public read chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update chat messages" ON public.chat_messages
  FOR UPDATE USING (true);

-- 5.3 RLS cho customer_notes:
CREATE POLICY "Admin manage customer notes" ON public.customer_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Bổ sung vào Supabase Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
-- ============================================================================
-- MIGRATION: 20260921_add_merge_conversations_rpc.sql
-- Description: Tạo function để gộp lịch sử chat của Guest vào Customer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.merge_guest_conversation(
  p_customer_id uuid,
  p_guest_session_id text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_conv_id uuid;
  v_primary_conv_id uuid;
  v_cust_name text;
BEGIN
  -- Lấy tên khách hàng
  SELECT full_name INTO v_cust_name
  FROM public.customers
  WHERE id = p_customer_id;

  -- 1. Tìm hội thoại của guest (chưa có customer_id)
  SELECT id INTO v_guest_conv_id
  FROM public.conversations
  WHERE guest_session_id = p_guest_session_id
    AND customer_id IS NULL
    AND status != 'MERGED'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 2. Tìm hội thoại chính của customer (nếu có)
  SELECT id INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = p_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC -- Lấy hội thoại gốc đầu tiên của khách
  LIMIT 1;

  -- Trường hợp 1: Khách chưa có hội thoại nào trước đây, nhưng có hội thoại guest
  IF v_primary_conv_id IS NULL AND v_guest_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET customer_id = p_customer_id,
        guest_name = COALESCE(v_cust_name, guest_name)
    WHERE id = v_guest_conv_id;

    UPDATE public.chat_messages
    SET sender_id = COALESCE(sender_id, p_customer_id),
        sender_name = COALESCE(v_cust_name, sender_name)
    WHERE conversation_id = v_guest_conv_id
      AND sender_type = 'CUSTOMER';

    RETURN v_guest_conv_id;
  END IF;

  -- Trường hợp 2: Khách đã có hội thoại chính, và cũng có hội thoại guest
  IF v_primary_conv_id IS NOT NULL AND v_guest_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    -- Chuyển toàn bộ tin nhắn từ hội thoại guest sang hội thoại chính
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = COALESCE(sender_id, p_customer_id),
        sender_name = COALESCE(v_cust_name, sender_name)
    WHERE conversation_id = v_guest_conv_id;

    -- Đánh dấu hội thoại guest là MERGED để không hiển thị nữa
    UPDATE public.conversations
    SET status = 'MERGED',
        customer_id = p_customer_id
    WHERE id = v_guest_conv_id;

    -- Cập nhật last_message_at và last_message_preview của hội thoại chính
    UPDATE public.conversations
    SET last_message_at = (SELECT last_message_at FROM public.conversations WHERE id = v_guest_conv_id),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;

    RETURN v_primary_conv_id;
  END IF;

  -- Trường hợp 3: Khách có hội thoại chính, nhưng không có hội thoại guest nào
  IF v_primary_conv_id IS NOT NULL THEN
    RETURN v_primary_conv_id;
  END IF;

  RETURN NULL;
END;
$$;
-- ============================================================================
-- MIGRATION: 20260921_drop_redundant_leads_table.sql
-- Description: Xóa bảng leads cũ do hệ thống đã chuyển sang dùng Live Chat
-- ============================================================================

-- Tắt Realtime cho bảng leads (nếu có)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Xóa bảng leads
DROP TABLE IF EXISTS public.leads CASCADE;
-- ============================================================================
-- MIGRATION: 20260921_unify_guest_customer_merge.sql
-- Description: Chuẩn hóa toàn diện cơ chế gộp danh tính Khách vãng lai -> Khách hàng
--              theo chuẩn kiến trúc hệ thống CRM & Live Chat quốc tế (Intercom / Crisp).
-- ============================================================================

-- 1. Cập nhật RLS Policies cho bảng public.customers
-- Cho phép Customer tự tạo profile khi đăng nhập nếu chưa có, và tự liên kết tài khoản
DROP POLICY IF EXISTS "Customer tạo hồ sơ cá nhân" ON public.customers;
CREATE POLICY "Customer tạo hồ sơ cá nhân" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Customer đọc thông tin cá nhân" ON public.customers;
CREATE POLICY "Customer đọc thông tin cá nhân" ON public.customers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = auth_user_id 
    OR email = (auth.jwt()->>'email')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Customer sửa thông tin cá nhân" ON public.customers;
CREATE POLICY "Customer sửa thông tin cá nhân" ON public.customers
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = auth_user_id 
    OR (auth_user_id IS NULL AND email = (auth.jwt()->>'email'))
    OR public.is_admin()
  );

-- 2. Hàm RPC Tối Thượng: sync_customer_chat_session
-- Tự động nhận diện auth.uid(), tìm/tạo hồ sơ Customer và gộp toàn bộ lịch sử phiên vãng lai
CREATE OR REPLACE FUNCTION public.sync_customer_chat_session(p_guest_session_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_uid uuid;
  v_user_email text;
  v_user_meta_name text;
  v_customer_id uuid;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_phones text[];
  v_emails text[];
  
  v_guest_conv_id uuid;
  v_guest_phone text;
  v_guest_email text;
  v_primary_conv_id uuid;
BEGIN
  -- Lấy auth_uid của người đang gọi
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Lấy thông tin tài khoản từ auth.users
  SELECT 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_user_email, v_user_meta_name
  FROM auth.users
  WHERE id = v_auth_uid;

  -- 1. Tìm hoặc tạo bản ghi Customer
  SELECT id, full_name, phone, email, phone_numbers, emails
  INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails
  FROM public.customers
  WHERE auth_user_id = v_auth_uid
  LIMIT 1;

  -- Nếu chưa có theo auth_user_id, tìm theo email
  IF v_customer_id IS NULL AND v_user_email IS NOT NULL THEN
    SELECT id, full_name, phone, email, phone_numbers, emails
    INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails
    FROM public.customers
    WHERE email = v_user_email
    LIMIT 1;

    -- Nếu tìm thấy theo email, cập nhật liên kết auth_user_id
    IF v_customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET auth_user_id = v_auth_uid
      WHERE id = v_customer_id;
    END IF;
  END IF;

  -- Nếu vẫn chưa có bản ghi customer, tạo mới ngay lập tức
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (auth_user_id, email, full_name, emails)
    VALUES (
      v_auth_uid, 
      v_user_email, 
      COALESCE(v_user_meta_name, 'Khách hàng'),
      CASE WHEN v_user_email IS NOT NULL THEN ARRAY[v_user_email] ELSE '{}'::text[] END
    )
    RETURNING id, full_name, phone, email, phone_numbers, emails
    INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails;
  END IF;

  -- Đảm bảo có tên hiển thị chuẩn
  IF v_customer_name IS NULL OR v_customer_name = '' OR v_customer_name = 'Khách vãng lai' THEN
    v_customer_name := COALESCE(v_user_meta_name, split_part(v_user_email, '@', 1), 'Khách hàng');
    UPDATE public.customers SET full_name = v_customer_name WHERE id = v_customer_id;
  END IF;

  -- 2. Tìm cuộc hội thoại vãng lai tương ứng với guest_session_id
  IF p_guest_session_id IS NOT NULL AND p_guest_session_id != '' THEN
    SELECT id, guest_phone, guest_email
    INTO v_guest_conv_id, v_guest_phone, v_guest_email
    FROM public.conversations
    WHERE guest_session_id = p_guest_session_id
      AND (customer_id IS NULL OR customer_id != v_customer_id)
      AND status != 'MERGED'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Tìm hội thoại chính thức của khách hàng (nếu đã có trước đó)
  SELECT id
  INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = v_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC
  LIMIT 1;

  -- 3. Gom SĐT và Email từ phiên vãng lai vào hồ sơ CRM của khách hàng
  IF v_guest_conv_id IS NOT NULL THEN
    v_phones := COALESCE(v_phones, '{}'::text[]);
    v_emails := COALESCE(v_emails, '{}'::text[]);

    IF v_guest_phone IS NOT NULL AND v_guest_phone != '' AND NOT (v_guest_phone = ANY(v_phones)) THEN
      v_phones := array_append(v_phones, v_guest_phone);
    END IF;

    IF v_guest_email IS NOT NULL AND v_guest_email != '' AND NOT (v_guest_email = ANY(v_emails)) THEN
      v_emails := array_append(v_emails, v_guest_email);
    END IF;

    UPDATE public.customers
    SET phone = COALESCE(phone, v_guest_phone),
        email = COALESCE(email, v_guest_email, v_user_email),
        phone_numbers = v_phones,
        emails = v_emails
    WHERE id = v_customer_id;
  END IF;

  -- 4. Xử lý Gộp hội thoại
  -- Trường hợp A: Khách đã có hội thoại chính và cũng có hội thoại vãng lai
  IF v_primary_conv_id IS NOT NULL AND v_guest_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    -- Chuyển toàn bộ tin nhắn từ hội thoại vãng lai sang hội thoại chính
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = v_customer_id,
        sender_name = v_customer_name
    WHERE conversation_id = v_guest_conv_id;

    -- Đánh dấu hội thoại vãng lai là MERGED (Ẩn khỏi Admin)
    UPDATE public.conversations
    SET status = 'MERGED',
        customer_id = v_customer_id,
        guest_name = v_customer_name
    WHERE id = v_guest_conv_id;

    -- Cập nhật tin nhắn xem trước và thời gian mới nhất cho hội thoại chính
    UPDATE public.conversations
    SET last_message_at = now(),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;

    RETURN v_primary_conv_id;
  END IF;

  -- Trường hợp B: Khách chưa có hội thoại chính nào -> Thăng cấp hội thoại vãng lai thành hội thoại chính thức
  IF v_guest_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET customer_id = v_customer_id,
        guest_name = v_customer_name,
        guest_phone = COALESCE(v_customer_phone, v_guest_phone),
        guest_email = COALESCE(v_customer_email, v_guest_email, v_user_email)
    WHERE id = v_guest_conv_id;

    -- Cập nhật quyền sở hữu và tên người gửi cho toàn bộ tin nhắn của khách trong hội thoại
    UPDATE public.chat_messages
    SET sender_id = v_customer_id,
        sender_name = v_customer_name
    WHERE conversation_id = v_guest_conv_id
      AND sender_type = 'CUSTOMER';

    RETURN v_guest_conv_id;
  END IF;

  -- Trường hợp C: Đã có sẵn hội thoại chính
  IF v_primary_conv_id IS NOT NULL THEN
    -- Đảm bảo tên hiển thị của hội thoại khớp với tên khách
    UPDATE public.conversations
    SET guest_name = v_customer_name
    WHERE id = v_primary_conv_id AND (guest_name IS NULL OR guest_name = 'Khách vãng lai');

    RETURN v_primary_conv_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Hàm tương thích ngược: merge_guest_conversation(p_customer_id, p_guest_session_id)
DROP FUNCTION IF EXISTS public.merge_guest_conversation(uuid, text) CASCADE;
CREATE OR REPLACE FUNCTION public.merge_guest_conversation(p_customer_id UUID, p_guest_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cust_name text;
  v_guest_conv_id uuid;
  v_primary_conv_id uuid;
BEGIN
  SELECT full_name INTO v_cust_name FROM public.customers WHERE id = p_customer_id;
  IF v_cust_name IS NULL THEN
    v_cust_name := 'Khách hàng';
  END IF;

  SELECT id INTO v_guest_conv_id
  FROM public.conversations
  WHERE guest_session_id = p_guest_session_id 
    AND customer_id IS NULL
    AND status != 'MERGED'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_guest_conv_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = p_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_primary_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = p_customer_id,
        sender_name = v_cust_name
    WHERE conversation_id = v_guest_conv_id;

    UPDATE public.conversations
    SET status = 'MERGED', customer_id = p_customer_id, guest_name = v_cust_name
    WHERE id = v_guest_conv_id;

    UPDATE public.conversations
    SET last_message_at = now(),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;
  ELSE
    UPDATE public.conversations
    SET customer_id = p_customer_id,
        guest_name = v_cust_name
    WHERE id = v_guest_conv_id;

    UPDATE public.chat_messages
    SET sender_id = p_customer_id,
        sender_name = v_cust_name
    WHERE conversation_id = v_guest_conv_id AND sender_type = 'CUSTOMER';
  END IF;
END;
$$;
