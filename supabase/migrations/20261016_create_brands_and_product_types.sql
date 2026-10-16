-- ==============================================================================
-- MIGRATION: THƯƠNG HIỆU (brands) & LOẠI SẢN PHẨM THEO THƯƠNG HIỆU (product_types)
-- Ngày: 2026-10-16
--
-- Phân cấp:  Danh mục (độc lập)  |  Thương hiệu -> Loại -> Sản phẩm
--   VD: Vinsky -> Vinsky blus -> "Xe điện vinsky blus ( ghi bóng )"
--
-- AN TOÀN DỮ LIỆU:
--   - Chỉ THÊM 2 bảng mới + THÊM 2 cột mới (cho phép NULL). Không xóa/đổi tên cột nào.
--   - Cột products.brand (text) và products.type (EQUIPMENT/PACKAGE) được GIỮ NGUYÊN.
--   - Xóa thương hiệu/loại -> sản phẩm chỉ bị gỡ liên kết (SET NULL), KHÔNG bị xóa.
--   - Idempotent: chạy lại nhiều lần không lỗi, không nhân bản dữ liệu.
--   - Chạy trong 1 transaction: lỗi ở đâu -> rollback toàn bộ, DB giữ nguyên như cũ.
--
-- KHUYẾN NGHỊ: Backup DB trước khi chạy (Supabase Dashboard -> Database -> Backups).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. BẢNG THƯƠNG HIỆU (dùng chung cho mọi danh mục)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brands (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_brands_slug UNIQUE (slug)
);

-- ------------------------------------------------------------------------------
-- 2. BẢNG LOẠI SẢN PHẨM (thuộc về 1 thương hiệu)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_types (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id    UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_types_brand_slug UNIQUE (brand_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_types_brand ON public.product_types(brand_id);

-- ------------------------------------------------------------------------------
-- 3. CỘT LIÊN KẾT TRÊN products (NULL = chưa gán)
-- ------------------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS product_type_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type_id);

-- ------------------------------------------------------------------------------
-- 4. RLS: public được đọc; ghi chỉ qua Backend (service role bỏ qua RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read brands" ON public.brands;
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read product_types" ON public.product_types;
CREATE POLICY "Public read product_types" ON public.product_types FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 5. CHUYỂN DỮ LIỆU CŨ (chỉ áp dụng cho sản phẩm CHƯA được gán)
-- ------------------------------------------------------------------------------

-- 5.1 Hàm tạm (tự mất khi hết phiên)
CREATE OR REPLACE FUNCTION pg_temp.nx_slug(p_text TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT btrim(regexp_replace(
        translate(lower(coalesce(p_text, '')),
            'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
            repeat('a', 17) || repeat('e', 11) || repeat('i', 5) || repeat('o', 17)
              || repeat('u', 11) || repeat('y', 5) || 'd'),
        '[^a-z0-9]+', '-', 'g'), '-')
$$;

-- Tên loại = tên SP bỏ phần "( màu )", bỏ tiền tố trùng tên danh mục, viết hoa chữ cái đầu
--   "Xe điện vinsky blus ( ghi bóng )" + danh mục "Xe điện" -> "Vinsky blus"
--   "Xe điện IYOKO i9"                                      -> "IYOKO i9"
CREATE OR REPLACE FUNCTION pg_temp.nx_type_name(p_name TEXT, p_category TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
    SELECT upper(left(s, 1)) || substr(s, 2)
    FROM (
        SELECT btrim(
            CASE
                WHEN p_category IS NOT NULL AND lower(n) LIKE lower(p_category) || ' %'
                    THEN substr(n, length(p_category) + 2)
                ELSE n
            END
        ) AS s
        FROM (
            SELECT regexp_replace(btrim(regexp_replace(p_name, '\s*\(.*$', '')), '\s+', ' ', 'g') AS n
        ) t0
    ) t
$$;

-- 5.2 Tạo thương hiệu từ cột brand (text) hiện có
INSERT INTO public.brands (name, slug)
SELECT DISTINCT ON (pg_temp.nx_slug(btrim(p.brand)))
       btrim(p.brand), pg_temp.nx_slug(btrim(p.brand))
FROM public.products p
WHERE p.brand IS NOT NULL
  AND pg_temp.nx_slug(btrim(p.brand)) <> ''
ORDER BY pg_temp.nx_slug(btrim(p.brand)), p.created_at
ON CONFLICT (slug) DO NOTHING;

-- 5.3 Gán brand_id cho sản phẩm
UPDATE public.products p
SET brand_id = b.id
FROM public.brands b
WHERE p.brand_id IS NULL
  AND p.brand IS NOT NULL
  AND b.slug = pg_temp.nx_slug(btrim(p.brand));

-- 5.4 Tạo loại cho từng thương hiệu
INSERT INTO public.product_types (brand_id, name, slug)
SELECT DISTINCT ON (x.brand_id, x.slug) x.brand_id, x.name, x.slug
FROM (
    SELECT p.brand_id,
           pg_temp.nx_type_name(p.name, c.name) AS name,
           pg_temp.nx_slug(pg_temp.nx_type_name(p.name, c.name)) AS slug,
           p.created_at
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.product_type_id IS NULL
      AND p.brand_id IS NOT NULL
) x
WHERE x.slug <> ''
ORDER BY x.brand_id, x.slug, x.created_at
ON CONFLICT (brand_id, slug) DO NOTHING;

-- 5.5 Gán product_type_id cho sản phẩm
UPDATE public.products p
SET product_type_id = pt.id
FROM public.product_types pt
WHERE p.product_type_id IS NULL
  AND p.brand_id IS NOT NULL
  AND pt.brand_id = p.brand_id
  AND pt.slug = pg_temp.nx_slug(pg_temp.nx_type_name(
        p.name,
        (SELECT c.name FROM public.categories c WHERE c.id = p.category_id)
      ));

COMMIT;

-- Báo PostgREST nạp lại schema để API nhận bảng/cột mới ngay
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- KIỂM TRA KẾT QUẢ (tùy chọn)
-- ------------------------------------------------------------------------------
-- SELECT b.name AS thuong_hieu, pt.name AS loai, count(p.id) AS so_san_pham
-- FROM brands b
-- LEFT JOIN product_types pt ON pt.brand_id = b.id
-- LEFT JOIN products p ON p.product_type_id = pt.id
-- GROUP BY 1, 2 ORDER BY 1, 2;
