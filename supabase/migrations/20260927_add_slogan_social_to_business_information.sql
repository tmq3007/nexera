-- Migration: Thêm cột slogan và social links vào bảng business_information
-- Mục đích: Cho phép admin sửa slogan và link mạng xã hội, hiển thị động trên footer

ALTER TABLE business_information
  ADD COLUMN IF NOT EXISTS slogan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT DEFAULT NULL;

-- Comment giải thích
COMMENT ON COLUMN business_information.slogan IS 'Slogan doanh nghiệp, hiển thị ở footer và các trang storefront';
COMMENT ON COLUMN business_information.facebook_url IS 'Link trang Facebook chính thức';
COMMENT ON COLUMN business_information.tiktok_url IS 'Link trang TikTok chính thức';
COMMENT ON COLUMN business_information.youtube_url IS 'Link kênh YouTube chính thức';
