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

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
      {/* Left: Image */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div 
          className={`aspect-square bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-4 overflow-hidden relative group ${
            mainImage ? "cursor-zoom-in" : ""
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

              {/* Nút gợi ý phóng to */}
              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all bg-black/60 hover:bg-black/80 text-white rounded-lg p-1.5 shadow-md flex items-center gap-1 text-[11px] font-medium backdrop-blur-xs z-10 pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Phóng to</span>
              </div>
              
              {allImages.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white text-gray-700 rounded-full shadow-sm border border-gray-200 transition-all z-10 cursor-pointer"
                    title="Ảnh trước"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
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
        {product.gallery && product.gallery.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {/* Main image thumbnail */}
            {product.image_url && (
              <div
                onClick={() => setMainImage(product.image_url)}
                className={`w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer flex items-center justify-center bg-gray-50 ${mainImage === product.image_url ? 'border-[var(--primary)]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <img
                  src={imagePresets.galleryThumb(product.image_url) ?? product.image_url}
                  alt="Main"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            )}
            {/* Gallery thumbnails */}
            {product.gallery.map((url: string, idx: number) => (
              <div
                key={idx}
                onClick={() => setMainImage(url)}
                className={`w-16 h-16 shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer flex items-center justify-center bg-gray-50 ${mainImage === url ? 'border-[var(--primary)]' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <img
                  src={imagePresets.galleryThumb(url) ?? url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/80 flex flex-col items-center text-center">
            <span className="text-gray-500 text-xs mb-1">Loại hình</span>
            <span className="text-gray-900 font-semibold text-sm">{product.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200/80 flex flex-col items-center text-center">
            <span className="text-gray-500 text-xs mb-1">Tồn kho</span>
            <span className="text-gray-900 font-semibold text-sm">{product.stock}</span>
          </div>
        </div>
      </div>

      {/* Right: Details */}
      <div className="w-full md:w-2/3 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.is_bestseller && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                Bán chạy
              </span>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500">
            <span>Danh mục: <strong className="text-gray-800 font-medium">{(product.categories as { name: string } | null)?.name || "Chưa phân loại"}</strong></span>
            <span>Xuất xứ: <strong className="text-gray-800 font-medium">{product.origin || "Chưa cập nhật"}</strong></span>
            <span>Bảo hành: <strong className="text-gray-800 font-medium">{product.warranty_info || "Chưa cập nhật"}</strong></span>
          </div>

          {product.stock <= 0 && product.restock_date && (
            <div className="mt-3 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-lg inline-block">
              Dự kiến hàng về: <strong className="font-semibold text-amber-900">{new Date(product.restock_date).toLocaleDateString('vi-VN')}</strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
            <div className="text-xs text-gray-500 mb-1">Giá bán</div>
            <div className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
            <div className="text-xs text-gray-500 mb-1">Thương hiệu</div>
            <div className="text-lg font-bold text-gray-800">
              {product.brand || "Chưa cập nhật"}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Mô tả sản phẩm</h3>
          <div 
            className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 quill-content"
            dangerouslySetInnerHTML={{ __html: product.description || "Chưa có mô tả." }}
          />
        </div>

        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Thông số kỹ thuật</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden text-sm">
              <table className="w-full text-left">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <th className="px-4 py-2 font-medium text-gray-700 border-b border-gray-100 w-1/3">{key}</th>
                      <td className="px-4 py-2 text-gray-600 border-b border-gray-100">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          {/* Top Bar: Title, Counter & Close Button */}
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
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="Đóng (Phím Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Image & Navigation */}
          <div 
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2 sm:left-4 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all shadow-xl cursor-pointer"
                title="Ảnh trước (Phím mũi tên trái)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={mainImage} 
              alt={product.name} 
              className="max-h-[70vh] sm:max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl transition-all"
            />

            {/* Next Button */}
            {allImages.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 sm:right-4 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all shadow-xl cursor-pointer"
                title="Ảnh sau (Phím mũi tên phải)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Bar: Thumbnails strip */}
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
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white/5 cursor-pointer ${
                    mainImage === url
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
