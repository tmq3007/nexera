/**
 * Supabase Image Transformation Utility
 *
 * Tận dụng Supabase Storage Image Transformation API để tự động
 * resize, compress và convert sang WebP trước khi gửi về browser.
 *
 * Docs: https://supabase.com/docs/guides/storage/image-transformations
 *
 * Cách dùng:
 *   getOptimizedImageUrl(url, { width: 80, quality: 70 })
 *   → Thumbnail 80px, quality 70%, format WebP
 */

export interface ImageTransformOptions {
  /** Chiều rộng tối đa (px). Giữ nguyên tỉ lệ ảnh. */
  width?: number;
  /** Chiều cao tối đa (px). Giữ nguyên tỉ lệ ảnh. */
  height?: number;
  /** Chất lượng nén (1–100). Mặc định: 80. */
  quality?: number;
  /** Resize mode. Mặc định: 'cover'. */
  resize?: "cover" | "contain" | "fill";
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Trả về URL đã tích hợp Supabase Image Transformation params.
 * Nếu URL không phải Supabase Storage thì trả về nguyên bản.
 * Nếu url là null/undefined thì trả về null.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: ImageTransformOptions = {}
): string | null {
  if (!url) return null;

  // Chỉ transform các ảnh trong Supabase Storage của project này
  if (!SUPABASE_URL || !url.startsWith(SUPABASE_URL)) return url;

  const { width, height, quality = 80, resize = "cover" } = options;

  // Supabase transform URL format:
  // /storage/v1/object/public/... → /storage/v1/render/image/public/...
  const transformedUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams();
  if (width)  params.set("width",   String(width));
  if (height) params.set("height",  String(height));
  params.set("quality", String(quality));
  params.set("resize",  resize);
  params.set("format",  "webp");

  return `${transformedUrl}?${params.toString()}`;
}

/**
 * Preset cố định cho các use-case phổ biến trong Nexera.
 */
export const imagePresets = {
  /** Thumbnail trong bảng Admin (40×40) */
  adminThumb: (url: string | null | undefined) =>
    getOptimizedImageUrl(url, { width: 80, height: 80, quality: 70 }),

  /** Gallery thumbnail trong Product Detail (64×64 → hiển thị 64px) */
  galleryThumb: (url: string | null | undefined) =>
    getOptimizedImageUrl(url, { width: 128, height: 128, quality: 70 }),

  /** Main image trong Admin Product Detail view */
  adminDetail: (url: string | null | undefined) =>
    getOptimizedImageUrl(url, { width: 600, quality: 85, resize: "contain" }),

  /** Card image trên Storefront (product card) */
  storefrontCard: (url: string | null | undefined) =>
    getOptimizedImageUrl(url, { width: 480, quality: 80 }),

  /** Hero image trên Storefront product detail page */
  storefrontHero: (url: string | null | undefined) =>
    getOptimizedImageUrl(url, { width: 1200, quality: 90, resize: "contain" }),
} as const;
