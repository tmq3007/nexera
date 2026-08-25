-- ==========================================
-- Migration: Add Admin RLS Policies for CRUD
-- ==========================================

-- 1. Categories
DROP POLICY IF EXISTS "Admin quản lý categories" ON public.categories;
CREATE POLICY "Admin quản lý categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Products
DROP POLICY IF EXISTS "Admin quản lý products" ON public.products;
CREATE POLICY "Admin quản lý products" ON public.products
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Articles
DROP POLICY IF EXISTS "Admin quản lý articles" ON public.articles;
CREATE POLICY "Admin quản lý articles" ON public.articles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Projects
DROP POLICY IF EXISTS "Admin quản lý projects" ON public.projects;
CREATE POLICY "Admin quản lý projects" ON public.projects
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Orders
DROP POLICY IF EXISTS "Admin quản lý orders" ON public.orders;
CREATE POLICY "Admin quản lý orders" ON public.orders
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Order Items
DROP POLICY IF EXISTS "Admin quản lý order_items" ON public.order_items;
CREATE POLICY "Admin quản lý order_items" ON public.order_items
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Leads
DROP POLICY IF EXISTS "Admin quản lý leads" ON public.leads;
CREATE POLICY "Admin quản lý leads" ON public.leads
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Customers
DROP POLICY IF EXISTS "Admin quản lý customers" ON public.customers;
CREATE POLICY "Admin quản lý customers" ON public.customers
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
