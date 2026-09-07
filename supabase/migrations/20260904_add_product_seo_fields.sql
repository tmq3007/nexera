-- ============================================================
-- Migration: Thêm SEO fields vào bảng products
-- Nexera - Nhóm 4: Product SEO Optimization
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(70),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160);

COMMENT ON COLUMN products.meta_title       IS 'SEO title tag (tối đa 70 ký tự). Nếu NULL, dùng products.name làm fallback.';
COMMENT ON COLUMN products.meta_description IS 'SEO meta description (tối đa 160 ký tự). Nếu NULL, dùng substring của products.description làm fallback.';
