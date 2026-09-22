"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { imagePresets } from "@/utils/imageUtils";

export function ProductDetailView({ product }: { product: any }) {
  const [mainImage, setMainImage] = useState(product?.image_url);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!product) return null;

  const allImages: string[] = [product.image_url, ...(product.gallery || [])].filter(Boolean);
  const currentIndex = allImages.indexOf(mainImage);

  const handleNext = useCallback(() => {
    if (allImages.length <= 1) return;
    if (currentIndex < allImages.length - 1) {
      setMainImage(allImages[currentIndex + 1]);
    } else {
      setMainImage(allImages[0]);
    }
  }, [allImages, currentIndex]);

  const handlePrev = useCallback(() => {
    if (allImages.length <= 1) return;
    if (currentIndex > 0) {
      setMainImage(allImages[currentIndex - 1]);
    } else {
      setMainImage(allImages[allImages.length - 1]);
    }
  }, [allImages, currentIndex]);

  // Phím tắt bàn phím khi mở Lightbox (Esc để đóng, mũi tên trái/phải để chuyển ảnh)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const stockQty = Number(product.stock || 0);
  const stockStatus =
    stockQty <= 0
      ? { label: "Hết hàng", cls: "text-rose-600 bg-rose-50" }
      : stockQty <= 5
        ? { label: "Sắp hết", cls: "text-amber-600 bg-amber-50" }
        : { label: "Còn hàng", cls: "text-emerald-600 bg-emerald-50" };

  return (
    <div className="flex flex-col md:flex-row gap-5 md:gap-6 p-2 sm:p-4 max-h-[75vh] overflow-y-auto custom-scrollbar">

      {/* ========== LEFT: Ảnh sản phẩm ========== */}
      <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col gap-3 shrink-0">
        {/* Main Image */}
        <div
          className={`aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-3 sm:p-4 overflow-hidden relative group ${mainImage ? "cursor-zoom-in" : ""
            }`}
          onClick={() => {
            if (mainImage) setIsLightboxOpen(true);
          }}
          title={mainImage ? "Bấm để xem ảnh phóng to" : undefined}
        >
          {mainImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePresets.adminDetail(mainImage) ?? mainImage}
                alt={product.name}
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-200 group-hover:scale-105"
              />

              {/* Gợi ý phóng to */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 shadow-md flex items-center gap-1 text-[11px] font-medium backdrop-blur-xs z-10 pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phóng to</span>
              </div>

              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-sm border border-gray-200 transition-all z-10 cursor-pointer"
                    title="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-sm border border-gray-200 transition-all z-10 cursor-pointer"
                    title="Ảnh sau"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 text-sm">
              <span>Chưa có hình ảnh</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {allImages.map((url, idx) => (
              <div
                key={idx}
                onClick={() => setMainImage(url)}
                className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer flex items-center justify-center bg-gray-50 transition-all ${mainImage === url ? "border-[var(--primary)] shadow-sm" : "border-gray-200 hover:border-gray-300"
                  }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePresets.galleryThumb(url) ?? url}
                  alt={`Ảnh ${idx + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply p-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Cards (Mobile: 2 cột, Desktop: 2 cột) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 text-center">
            <span className="text-[11px] text-gray-400 block mb-0.5">Loại hình</span>
            <span className="text-sm font-semibold text-gray-900">{product.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/80 text-center">
            <span className="text-[11px] text-gray-400 block mb-0.5">Tồn kho</span>
            <span className={`text-sm font-semibold ${stockQty <= 0 ? "text-rose-600" : stockQty <= 5 ? "text-amber-600" : "text-gray-900"}`}>
              {stockQty}
            </span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT: Chi tiết sản phẩm ========== */}
      <div className="w-full md:w-3/5 lg:w-2/3 space-y-4 md:space-y-5">

        {/* Header: Badges + Tên */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stockStatus.cls}`}>
              {stockStatus.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.is_active !== false ? "text-emerald-600 bg-emerald-50" : "text-gray-500 bg-gray-100"}`}>
              {product.is_active !== false ? "Đang bán" : "Đang ẩn"}
            </span>
            {product.is_bestseller && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                ★ Bán chạy
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{product.name}</h2>

          {/* Meta dòng ngang */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            {product.sku && (
              <span>SKU: <strong className="text-gray-700 font-medium">{product.sku}</strong></span>
            )}
            <span>Danh mục: <strong className="text-gray-700 font-medium">{(product.categories as { name: string } | null)?.name || "—"}</strong></span>
            {product.brand && (
              <span>Thương hiệu: <strong className="text-gray-700 font-medium">{product.brand}</strong></span>
            )}
          </div>

          {product.stock <= 0 && product.restock_date && (
            <div className="mt-2.5 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-lg inline-block border border-amber-100">
              Dự kiến hàng về: <strong className="font-semibold text-amber-900">{new Date(product.restock_date).toLocaleDateString("vi-VN")}</strong>
            </div>
          )}
        </div>

        {/* Pricing: 2 cột mobile, 4 cột desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="text-[11px] text-gray-400 mb-0.5">Giá bán</div>
            <div className="text-sm sm:text-base font-bold text-gray-900">{formatCurrency(product.price)}</div>
          </div>
          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="text-[11px] text-gray-400 mb-0.5">Giá nhập</div>
            <div className="text-sm sm:text-base font-bold text-gray-800">
              {product.import_price ? formatCurrency(product.import_price) : "—"}
            </div>
          </div>
          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="text-[11px] text-gray-400 mb-0.5">Giảm giá</div>
            <div className={`text-sm sm:text-base font-bold ${product.discount_rate ? "text-rose-600" : "text-gray-400"}`}>
              {product.discount_rate ? `-${product.discount_rate}%` : "0%"}
            </div>
          </div>
          <div className="p-3 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
            <div className="text-[11px] text-gray-400 mb-0.5">Giá sau giảm</div>
            <div className="text-sm sm:text-base font-bold text-emerald-600">
              {product.discount_rate
                ? formatCurrency(product.price * (1 - product.discount_rate / 100))
                : formatCurrency(product.price)}
            </div>
          </div>
        </div>

        {/* Extra Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <div className="text-[11px] text-gray-400 mb-0.5">Xuất xứ</div>
            <div className="text-sm font-semibold text-gray-800">{product.origin || "—"}</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <div className="text-[11px] text-gray-400 mb-0.5">Bảo hành</div>
            <div className="text-sm font-semibold text-gray-800">{product.warranty_info || "—"}</div>
          </div>
          {product.supplier && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
              <div className="text-[11px] text-gray-400 mb-0.5">Nhà cung cấp</div>
              <div className="text-sm font-semibold text-gray-800">{product.supplier}</div>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
            <div className="text-[11px] text-gray-400 mb-0.5">Slug (URL)</div>
            <div className="text-[11px] font-mono text-gray-500 truncate">{product.slug || "—"}</div>
          </div>
          {product.created_at && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
              <div className="text-[11px] text-gray-400 mb-0.5">Ngày tạo</div>
              <div className="text-sm font-semibold text-gray-800">{new Date(product.created_at).toLocaleDateString("vi-VN")}</div>
            </div>
          )}
        </div>

        {/* Mô tả */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Mô tả sản phẩm</h3>
          <div
            className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 quill-content max-h-40 overflow-y-auto custom-scrollbar"
            dangerouslySetInnerHTML={{ __html: product.description || "<em class='text-gray-400'>Chưa có mô tả.</em>" }}
          />
        </div>

        {/* Thông số kỹ thuật */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Thông số kỹ thuật</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
              <table className="w-full text-left">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <th className="px-4 py-2.5 font-medium text-gray-700 border-b border-gray-100 w-2/5 text-xs sm:text-sm">{key}</th>
                      <td className="px-4 py-2.5 text-gray-600 border-b border-gray-100 text-xs sm:text-sm">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO */}
        {(product.meta_title || product.meta_description) && (
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">SEO Metadata</h3>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1.5 text-sm">
              {product.meta_title && (
                <div>
                  <span className="text-[11px] text-gray-400">Title: </span>
                  <span className="text-gray-800">{product.meta_title}</span>
                </div>
              )}
              {product.meta_description && (
                <div>
                  <span className="text-[11px] text-gray-400">Description: </span>
                  <span className="text-gray-800">{product.meta_description}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= LIGHTBOX / FULLSCREEN IMAGE VIEWER ================= */}
      {isLightboxOpen && mainImage && (
        <div
          className="fixed inset-0 z-[250] flex flex-col items-center justify-between p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none cursor-zoom-out"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between z-10 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-white/90 font-bold text-sm sm:text-base line-clamp-1">
                {product.name}
              </span>
              {allImages.length > 1 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-medium border border-white/10">
                  {currentIndex + 1} / {allImages.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md min-w-11 min-h-11 sm:min-w-0 sm:min-h-0"
              title="Đóng (Phím Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Image */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-1 sm:left-4 z-20 w-10 h-10 sm:w-11 sm:h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all shadow-xl cursor-pointer"
                title="Ảnh trước (Phím mũi tên trái)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImage}
              alt={product.name}
              className="max-h-[65vh] sm:max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-1 sm:right-4 z-20 w-10 h-10 sm:w-11 sm:h-11 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all shadow-xl cursor-pointer"
                title="Ảnh sau (Phím mũi tên phải)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Bottom: Thumbnails strip */}
          {allImages.length > 1 && (
            <div
              className="flex items-center gap-2 max-w-full overflow-x-auto py-1.5 px-3 rounded-xl bg-black/40 backdrop-blur-xs border border-white/10 custom-scrollbar z-10 cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMainImage(url)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 min-w-11 min-h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white/5 cursor-pointer ${mainImage === url
                    ? "border-[var(--primary)] scale-105 shadow-md opacity-100"
                    : "border-white/20 hover:border-white/50 opacity-60 hover:opacity-100"
                    }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePresets.galleryThumb(url) ?? url}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-contain p-1 bg-white/90"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
