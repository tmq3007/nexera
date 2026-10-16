"use client";

import { useMemo, useState } from "react";
import { Eye, Scale, Check, ShoppingCart, Star, Calendar } from "lucide-react";
import type { ProductGroup } from "@/lib/catalog/groupProducts";
import { formatCurrency, getProductPriceInfo } from "@/lib/catalog/price";

interface ProductGroupCardProps {
  group: ProductGroup;
  isAdmin: boolean;
  isCompared: (productId: string) => boolean;
  onQuickView: (product: any) => void;
  onToggleCompare: (product: any, e?: React.MouseEvent) => void;
  onAddToCart: (product: any, e?: React.MouseEvent) => void;
  onBuyNow: (product: any, e?: React.MouseEvent) => void;
}

/**
 * Thẻ sản phẩm theo cụm: 1 thẻ = 1 Loại (VD "Vinsky blus"), các màu là chấm chọn.
 * Mỗi màu vẫn là 1 sản phẩm riêng → giỏ hàng / so sánh dùng đúng sản phẩm đang chọn.
 */
export function ProductGroupCard({
  group,
  isAdmin,
  isCompared,
  onQuickView,
  onToggleCompare,
  onAddToCart,
  onBuyNow,
}: ProductGroupCardProps) {
  const defaultIndex = useMemo(() => {
    const idx = group.variants.findIndex((v) => Number(v.product.stock) > 0);
    return idx >= 0 ? idx : 0;
  }, [group.variants]);
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);
  const variant = group.variants[selectedIndex] || group.variants[0];
  const product = variant.product;
  const hasVariants = group.variants.length > 1;
  const compared = isCompared(product.id);
  const { originalPrice, discountedPrice, hasDiscount } = getProductPriceInfo(product);

  const priceRange = useMemo(() => {
    if (!hasVariants) return null;
    const prices = group.variants.map((v) => getProductPriceInfo(v.product).discountedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? null : { min, max };
  }, [group.variants, hasVariants]);

  const inStock = Number(product.stock) > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden flex flex-col group transition-all border border-gray-100 relative">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 p-6 flex items-center justify-center group/img overflow-hidden border-b border-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={product.id}
          src={product.image_url || "/doi.png"}
          alt={product.name}
          className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-500 animate-in fade-in"
        />

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.is_bestseller && (
            <div className="bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-md uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />
              Bán Chạy
            </div>
          )}
          {product.discount_rate > 0 && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm w-fit">
              -{product.discount_rate}%
            </div>
          )}
        </div>

        {hasVariants && (
          <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur text-[#13426E] text-[10px] font-bold px-2 py-1 rounded-md border border-gray-200 shadow-sm">
            {group.variants.length} phiên bản
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-[#13426E]/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] z-20">
          <div className="flex items-center gap-3 transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
            <div className="relative group/btn">
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="w-10 h-10 bg-white text-[#13426E] rounded-full shadow-lg flex items-center justify-center hover:bg-[#13426E] hover:text-white transition-colors"
                aria-label="Xem nhanh"
              >
                <Eye className="w-4 h-4" />
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md">
                Xem nhanh
              </span>
            </div>
            <div className="relative group/btn">
              <button
                type="button"
                onClick={(e) => onToggleCompare(product, e)}
                className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors ${compared
                  ? "bg-[#13426E] text-white"
                  : "bg-white text-[#13426E] hover:bg-[#13426E] hover:text-white"
                  }`}
                aria-label="So sánh"
              >
                <Scale className="w-4 h-4" />
                {compared && <Check className="w-3 h-3 absolute -bottom-1 -right-1 bg-[#80BF49] rounded-full text-white border border-white" />}
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md z-30">
                {compared ? "Bỏ so sánh" : "So sánh"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {group.brandName && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#80BF49] mb-1">
            {group.brandName}
          </span>
        )}
        <h3
          className="text-[15px] md:text-[17px] font-bold text-[#13426E] mb-2.5 group-hover:text-[#80BF49] transition-colors line-clamp-2 leading-snug"
          title={hasVariants ? group.title : product.name}
        >
          {hasVariants ? group.title : product.name}
        </h3>

        {hasVariants ? (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              Phiên bản: <strong className="text-gray-800">{variant.label}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              {group.variants.map((v, idx) => {
                const active = idx === selectedIndex;
                const out = Number(v.product.stock) <= 0;
                return v.color ? (
                  <button
                    key={v.product.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    title={`${v.label}${out ? " (hết hàng)" : ""}`}
                    aria-label={v.label}
                    aria-pressed={active}
                    className={`relative w-7 h-7 rounded-full border-2 transition-all ${active ? "border-[#13426E] scale-110 shadow-md" : "border-white ring-1 ring-gray-200 hover:ring-[#13426E]/40"
                      } ${out ? "opacity-40" : ""}`}
                    style={{ backgroundColor: v.color }}
                  >
                    {out && <span className="absolute inset-0 m-auto w-[2px] h-full bg-gray-500 rotate-45 rounded" />}
                  </button>
                ) : (
                  <button
                    key={v.product.id}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors max-w-[140px] truncate ${active
                      ? "bg-[#13426E] text-white border-[#13426E]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#13426E] hover:text-[#13426E]"
                      } ${out ? "line-through opacity-60" : ""}`}
                    title={v.label}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="text-gray-500 mb-4 flex-1 text-sm line-clamp-3 leading-relaxed [&_p]:inline [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: (product.description || "").replace(/&nbsp;/g, " ") }}
          />
        )}

        <div className="mt-auto pt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between mb-1">
              <div className="flex flex-col">
                {hasDiscount ? (
                  <>
                    <div className="text-lg md:text-[22px] font-extrabold text-[#E30019] tracking-tight leading-none">
                      {formatCurrency(discountedPrice)}
                    </div>
                    <div className="text-[13px] font-medium text-gray-400 line-through mt-1.5">
                      {formatCurrency(originalPrice)}
                    </div>
                  </>
                ) : (
                  <div className="text-lg md:text-[22px] font-extrabold text-[#13426E] tracking-tight leading-none">
                    {formatCurrency(originalPrice)}
                  </div>
                )}
                {priceRange && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    Từ {formatCurrency(priceRange.min)} – {formatCurrency(priceRange.max)}
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg uppercase tracking-wide shrink-0 ${inStock ? "bg-[#80BF49]/10 text-[#80BF49]" : "bg-red-50 text-red-600"}`}>
                {inStock ? "Còn hàng" : "Hết hàng"}
              </span>
            </div>
            {!inStock && product.restock_date && (
              <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 mt-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Có hàng: <strong>{new Date(product.restock_date).toLocaleDateString('vi-VN')}</strong></span>
              </div>
            )}
          </div>

          {!isAdmin && (
            !inStock ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-nexera-chat'))}
                className="w-full py-3 bg-gray-100 hover:bg-[#80BF49] text-gray-600 hover:text-white text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-1"
              >
                Nhận Tư Vấn Ngay
              </button>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => onAddToCart(product, e)}
                  className="w-[46px] h-[46px] bg-gray-50 border border-gray-200 hover:border-[#80BF49] hover:bg-[#80BF49] text-gray-500 hover:text-white rounded-xl flex items-center justify-center transition-all group shrink-0"
                  title="Thêm vào giỏ"
                >
                  <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
                <button
                  type="button"
                  onClick={(e) => onBuyNow(product, e)}
                  className="flex-1 h-[46px] bg-[#13426E] text-white rounded-xl font-bold hover:bg-[#1a5b99] hover:shadow-md transition-all text-[15px] flex items-center justify-center"
                >
                  Mua Ngay
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
