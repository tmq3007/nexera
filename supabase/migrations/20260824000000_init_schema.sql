-- Khởi tạo extension (nếu chưa có)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CMS & Nội dung (Public Read)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    image_url TEXT,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    completion_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bán hàng (E-commerce)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL, -- 'EQUIPMENT', 'PACKAGE'
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRM & Đơn hàng
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, SHIPPED, COMPLETED
    payment_method TEXT,
    payos_order_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, RESOLVED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Bật RLS cho tất cả các bảng
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Cấp quyền Đọc (SELECT) công khai (Public) cho dữ liệu hiển thị trên Web
CREATE POLICY "Cho phép tất cả đọc categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả đọc products" ON public.products FOR SELECT USING (true);

-- Cho phép khách vãng lai gửi Form tư vấn (Insert)
CREATE POLICY "Cho phép khách tạo leads" ON public.leads FOR INSERT WITH CHECK (true);

-- (Các quyền Insert/Update/Delete còn lại sẽ mặc định bị từ chối với public/anon, 
--  chỉ có Supabase Service Role Key (dùng ở NestJS backend) hoặc Admin (xử lý sau qua Auth) 
--  mới có quyền thao tác.)
