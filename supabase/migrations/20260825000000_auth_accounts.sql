-- ==========================================
-- MIGRATION: Hệ thống Authentication & RBAC (Role-Based Access Control)
-- Ngày: 2026-08-25
-- Mục đích: 
--   - Tách biệt Admin vs Khách hàng
--   - RBAC: roles, permissions, role_permissions cho khả năng mở rộng
-- ==========================================

-- 1. ROLES - Định nghĩa vai trò
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,          -- 'super_admin', 'editor', 'sales', ...
    display_name TEXT NOT NULL,         -- 'Quản trị viên cấp cao', 'Biên tập viên', ...
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT false, -- Role hệ thống không được xóa
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Định nghĩa các vai trò trong hệ thống. is_system=true là role mặc định không được phép xóa.';

-- 2. PERMISSIONS - Định nghĩa quyền hạn
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,          -- 'products.read', 'products.write', 'orders.manage', ...
    display_name TEXT NOT NULL,         -- 'Xem sản phẩm', 'Thêm/sửa sản phẩm', ...
    module TEXT NOT NULL,               -- 'products', 'orders', 'articles', 'leads', 'admin', ...
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.permissions IS 'Danh sách quyền hạn chi tiết theo từng module. Dùng naming convention: module.action (vd: products.write).';

-- 3. ROLE_PERMISSIONS - Liên kết vai trò với quyền hạn (Many-to-Many)
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

COMMENT ON TABLE public.role_permissions IS 'Bảng trung gian gắn quyền (permissions) vào vai trò (roles).';

-- 4. ADMIN_ACCOUNTS - Quản lý tài khoản quản trị viên
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

-- 5. Bổ sung cột cho bảng customers hiện có
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==========================================
-- SEED: Dữ liệu mặc định cho RBAC
-- ==========================================

-- Roles mặc định
INSERT INTO public.roles (name, display_name, description, is_system) VALUES
  ('super_admin', 'Quản trị viên cấp cao', 'Toàn quyền hệ thống, quản lý tài khoản admin và phân quyền.', true),
  ('editor',      'Biên tập viên',         'Quản lý nội dung: sản phẩm, bài viết, dự án, danh mục.', true),
  ('sales',       'Nhân viên kinh doanh',  'Quản lý đơn hàng, khách hàng, yêu cầu tư vấn (leads).', true);

-- Permissions mặc định
INSERT INTO public.permissions (name, display_name, module) VALUES
  -- Module: Dashboard
  ('dashboard.view',      'Xem tổng quan',            'dashboard'),
  -- Module: Sản phẩm
  ('products.read',       'Xem sản phẩm',             'products'),
  ('products.write',      'Thêm/sửa sản phẩm',       'products'),
  ('products.delete',     'Xóa sản phẩm',             'products'),
  -- Module: Danh mục
  ('categories.read',     'Xem danh mục',             'categories'),
  ('categories.write',    'Thêm/sửa danh mục',        'categories'),
  ('categories.delete',   'Xóa danh mục',             'categories'),
  -- Module: Đơn hàng
  ('orders.read',         'Xem đơn hàng',             'orders'),
  ('orders.manage',       'Cập nhật trạng thái đơn',  'orders'),
  -- Module: Khách hàng
  ('customers.read',      'Xem khách hàng',           'customers'),
  ('customers.write',     'Sửa thông tin khách hàng', 'customers'),
  -- Module: Leads (Yêu cầu tư vấn)
  ('leads.read',          'Xem yêu cầu tư vấn',      'leads'),
  ('leads.manage',        'Xử lý yêu cầu tư vấn',    'leads'),
  -- Module: Bài viết
  ('articles.read',       'Xem bài viết',             'articles'),
  ('articles.write',      'Thêm/sửa bài viết',        'articles'),
  ('articles.delete',     'Xóa bài viết',             'articles'),
  -- Module: Dự án
  ('projects.read',       'Xem dự án',                'projects'),
  ('projects.write',      'Thêm/sửa dự án',           'projects'),
  ('projects.delete',     'Xóa dự án',                'projects'),
  -- Module: Quản trị hệ thống
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- roles & permissions: Tất cả admin đã đăng nhập đều đọc được (phục vụ UI)
CREATE POLICY "Admin đọc roles" ON public.roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_accounts aa WHERE aa.auth_user_id = auth.uid() AND aa.is_active = true)
  );

CREATE POLICY "Admin đọc permissions" ON public.permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_accounts aa WHERE aa.auth_user_id = auth.uid() AND aa.is_active = true)
  );

CREATE POLICY "Admin đọc role_permissions" ON public.role_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_accounts aa WHERE aa.auth_user_id = auth.uid() AND aa.is_active = true)
  );

-- Chỉ super_admin mới CRUD roles, permissions, role_permissions
CREATE POLICY "Super Admin quản lý roles" ON public.roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts aa
      JOIN public.roles r ON aa.role_id = r.id
      WHERE aa.auth_user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Super Admin quản lý permissions" ON public.permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts aa
      JOIN public.roles r ON aa.role_id = r.id
      WHERE aa.auth_user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

CREATE POLICY "Super Admin quản lý role_permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts aa
      JOIN public.roles r ON aa.role_id = r.id
      WHERE aa.auth_user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- admin_accounts: Mỗi admin đọc record của mình
CREATE POLICY "Admin đọc thông tin của mình" ON public.admin_accounts
  FOR SELECT USING (auth.uid() = auth_user_id);

-- admin_accounts: Super Admin đọc/quản lý tất cả
CREATE POLICY "Super Admin quản lý tài khoản admin" ON public.admin_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.admin_accounts aa
      JOIN public.roles r ON aa.role_id = r.id
      WHERE aa.auth_user_id = auth.uid() AND r.name = 'super_admin'
    )
  );

-- customers: Bổ sung policies
CREATE POLICY "Customer đọc thông tin của mình" ON public.customers
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Customer sửa thông tin của mình" ON public.customers
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admin đọc tất cả customers" ON public.customers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admin_accounts aa WHERE aa.auth_user_id = auth.uid() AND aa.is_active = true)
  );

-- ==========================================
-- TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_admin_accounts
    BEFORE UPDATE ON public.admin_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_customers
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_admin_accounts_auth_user_id ON public.admin_accounts(auth_user_id);
CREATE INDEX idx_admin_accounts_role_id ON public.admin_accounts(role_id);
CREATE INDEX idx_customers_auth_user_id ON public.customers(auth_user_id);
CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX idx_permissions_module ON public.permissions(module);

-- ==========================================
-- HELPER FUNCTION: Kiểm tra quyền hạn của user hiện tại
-- Dùng trong RLS hoặc application code: SELECT has_permission('products.write')
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
-- SEED: Tài khoản mặc định (Admin & Customer)
-- Admin:    admin@nexera.vn / admin
-- Customer: customer@nexera.vn / customer
-- ==========================================

-- Đảm bảo extension pgcrypto đã bật (Supabase bật sẵn)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tạo tài khoản Admin trong auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@nexera.vn',
    crypt('admin', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nexera Admin"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    ''
);

-- Tạo identity cho Admin (bắt buộc để Supabase Auth hoạt động)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@nexera.vn"}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000001',
    NOW(),
    NOW(),
    NOW()
);

-- Liên kết Admin vào admin_accounts với role super_admin
INSERT INTO public.admin_accounts (auth_user_id, display_name, role_id, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nexera Admin',
    (SELECT id FROM public.roles WHERE name = 'super_admin'),
    true
);

-- Tạo tài khoản Customer trong auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'customer@nexera.vn',
    crypt('customer', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Khách Hàng Mặc Định"}'::jsonb,
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    ''
);

-- Tạo identity cho Customer
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    '{"sub":"00000000-0000-0000-0000-000000000002","email":"customer@nexera.vn"}'::jsonb,
    'email',
    '00000000-0000-0000-0000-000000000002',
    NOW(),
    NOW(),
    NOW()
);

-- Liên kết Customer vào bảng customers
INSERT INTO public.customers (full_name, email, phone, auth_user_id)
VALUES (
    'Khách Hàng Mặc Định',
    'customer@nexera.vn',
    '0900000000',
    '00000000-0000-0000-0000-000000000002'
);
