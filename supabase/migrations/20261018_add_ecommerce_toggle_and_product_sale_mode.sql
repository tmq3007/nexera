-- ==============================================================================
-- Migration: Thêm công tắc Ecommerce toàn cục và chế độ bán lẻ cho từng sản phẩm
-- Ngày: 18/10/2026
-- ==============================================================================

-- 1. Thêm cột ecommerce_enabled vào bảng business_information
ALTER TABLE public.business_information
ADD COLUMN IF NOT EXISTS ecommerce_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.business_information.ecommerce_enabled IS 'Công tắc toàn cục bật/tắt tính năng bán hàng online (Ecommerce: giỏ hàng, mua ngay, checkout)';

-- 2. Thêm cột sale_mode và price_display vào bảng products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS sale_mode TEXT NOT NULL DEFAULT 'inherit'
  CONSTRAINT products_sale_mode_check CHECK (sale_mode IN ('inherit', 'buyable', 'consult_only'));

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS price_display TEXT NOT NULL DEFAULT 'show'
  CONSTRAINT products_price_display_check CHECK (price_display IN ('show', 'contact'));

COMMENT ON COLUMN public.products.sale_mode IS 'Chế độ bán: inherit (theo công tắc toàn cục), buyable (luôn cho mua lẻ), consult_only (luôn chỉ tư vấn)';
COMMENT ON COLUMN public.products.price_display IS 'Hiển thị giá: show (hiển thị giá bán bình thường), contact (hiển thị Liên hệ báo giá)';
