"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Star, ShoppingCart, Zap, MessageSquare, ArrowRight, Eye, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/contexts/ToastContext";
import { createClient } from "@/utils/supabase/client";


function getProductImages(product: any): string[] {
  const list: string[] = [];

  if (product?.image_url) {
    list.push(product.image_url);
  }

  if (Array.isArray(product?.images)) {
    product.images.forEach((img: any) => {
      const url = typeof img === "string" ? img : img?.url;
      if (url && typeof url === "string" && !list.includes(url)) {
        list.push(url);
      }
    });
  }

  if (Array.isArray(product?.gallery)) {
    product.gallery.forEach((url: any) => {
      if (url && typeof url === "string" && !list.includes(url)) {
        list.push(url);
      }
    });
  }

  return list.length > 0 ? list : [product?.image_url || "/doi.png"];
}

function ProductCardImageCarousel({ product }: { product: any }) {
  const images = getProductImages(product);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length <= 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={images[0] || "/doi.png"}
        alt={product.name}
        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
      />
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center group/carousel">
      {/* Active Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[currentIndex]}
        alt={`${product.name} - Ảnh ${currentIndex + 1}`}
        className="w-full h-full object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-105"
      />

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md text-[#13426E] hover:bg-[#80BF49] hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all z-20 cursor-pointer"
        title="Ảnh trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 shadow-md text-[#13426E] hover:bg-[#80BF49] hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all z-20 cursor-pointer"
        title="Ảnh tiếp theo"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full opacity-90 group-hover/carousel:opacity-100 transition-opacity">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => handleDotClick(idx, e)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              idx === currentIndex
                ? "bg-[#80BF49] w-3.5"
                : "bg-white/70 hover:bg-white w-1.5"
            }`}
            title={`Chuyển đến ảnh ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function BestSellersSection({ products = [] }: { products: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const addItem = useCartStore((state) => state.addItem);
  const toast = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [consultProduct, setConsultProduct] = useState<any | null>(null);
  const [isConsultOpen, setIsConsultOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: adminData } = await supabase
          .from("admin_accounts")
          .select("id")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (adminData) {
          setIsAdmin(true);
        }
      }
    }
    checkAdmin();
  }, [supabase]);

  const bestSellers = products.filter((p) => p.is_bestseller || p.is_active);
  // Take up to 12 bestseller products for smooth carousel sliding
  const displayProducts = bestSellers.slice(0, 12);

  // Embla Carousel Setup for Horizontal Scrolling
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true,
      skipSnaps: false,
    },
    [Autoplay({ delay: 5000, stopOnInteraction: true })]
  );

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!displayProducts || displayProducts.length === 0) {
    return null;
  }

  const handleAddToCart = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (product.stock <= 0) {
      handleOpenConsult(product, e);
      return;
    }
    const price = product.discount_rate > 0 
      ? Math.round(product.price * (1 - product.discount_rate / 100))
      : product.price;

    addItem({
      id: product.id,
      name: product.name,
      price: price,
      image_url: product.image_url || "",
      type: product.type || "EQUIPMENT"
    });
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleBuyNow = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleAddToCart(product);
    router.push('/gio-hang');
  };

  const handleOpenConsult = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setConsultProduct(product);
    setIsConsultOpen(true);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-[#F0F7FB] via-white to-[#F0F7FB] relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-1/4 w-72 h-72 bg-[#80BF49]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#13426E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#13426E] uppercase tracking-tight relative inline-block">
            Sản Phẩm Bán Chạy
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#80BF49] rounded-full"></div>
          </h2>
        </div>

        {/* Horizontal Embla Carousel Track Container with Side Navigation Buttons */}
        <div className="relative group/main-carousel px-2 sm:px-4">
          {/* Side Prev Button */}
          <button
            onClick={scrollPrev}
            disabled={!prevBtnEnabled}
            className="absolute -left-2 sm:-left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gray-200 bg-white/95 text-[#13426E] shadow-xl flex items-center justify-center hover:bg-[#80BF49] hover:text-white hover:border-[#80BF49] disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 z-30 cursor-pointer hover:scale-110"
            title="Sản phẩm trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Carousel Track */}
          <div className="overflow-hidden py-2 -mx-2 px-2" ref={emblaRef}>
            <div className="flex gap-6">
              {displayProducts.map((product) => {
                const hasDiscount = product.discount_rate > 0;
                const discountedPrice = hasDiscount 
                  ? Math.round(product.price * (1 - product.discount_rate / 100))
                  : product.price;

                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(25%-18px)] min-w-0"
                  >
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1 relative h-full">
                      {/* Clean Image Container (No Text Badges Over Image) */}
                      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center p-4">
                        <ProductCardImageCarousel product={product} />

                        {/* Optional Minimal Discount Tag (No Text Overlay) */}
                        {hasDiscount && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm z-10">
                            -{product.discount_rate}%
                          </div>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {product.brand && (
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#80BF49] mb-1">
                              {product.brand}
                            </p>
                          )}
                          <h3 className="text-[15px] md:text-[17px] font-bold text-[#13426E] mb-2.5 group-hover:text-[#80BF49] transition-colors line-clamp-2 leading-snug" title={product.name}>
                            {product.name}
                          </h3>
                        </div>

                        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-gray-100">
                          {/* Pricing */}
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex flex-col">
                              {hasDiscount ? (
                                <>
                                  <div className="text-lg md:text-[22px] font-extrabold text-[#E30019] tracking-tight leading-none">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(discountedPrice)}
                                  </div>
                                  <div className="text-[13px] font-medium text-gray-400 line-through mt-1.5">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-lg md:text-[22px] font-extrabold text-[#13426E] tracking-tight leading-none">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                </div>
                              )}
                            </div>
                            <span className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg uppercase tracking-wide shrink-0 ${!isOutOfStock ? "bg-[#80BF49]/10 text-[#80BF49]" : "bg-red-50 text-red-600"}`}>
                              {!isOutOfStock ? "Còn hàng" : "Hết hàng"}
                            </span>
                          </div>

                          {/* Stock Status & Restock Date */}
                          {isOutOfStock && product.restock_date && (
                            <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Có hàng: <strong>{new Date(product.restock_date).toLocaleDateString('vi-VN')}</strong></span>
                            </div>
                          )}

                          {/* Action Buttons Matching ProductCatalog */}
                          {!isAdmin && (
                            isOutOfStock ? (
                              <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-nexera-chat'))}
                                className="w-full py-3 bg-gray-100 hover:bg-[#80BF49] hover:text-white text-gray-600 text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm mt-1"
                              >
                                Nhận Tư Vấn Ngay
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={(e) => handleAddToCart(product, e)}
                                  className="w-[46px] h-[46px] bg-gray-50 border border-gray-200 hover:border-[#80BF49] hover:bg-[#80BF49] text-gray-500 hover:text-white rounded-xl flex items-center justify-center transition-all group shrink-0"
                                  title="Thêm vào giỏ"
                                >
                                  <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110" />
                                </button>
                                <button
                                  onClick={(e) => handleBuyNow(product, e)}
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
                  </div>
              );
            })}
          </div>
        </div>

        {/* Side Next Button */}
        <button
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
          className="absolute -right-2 sm:-right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-gray-200 bg-white/95 text-[#13426E] shadow-xl flex items-center justify-center hover:bg-[#80BF49] hover:text-white hover:border-[#80BF49] disabled:opacity-0 disabled:pointer-events-none transition-all duration-300 z-30 cursor-pointer hover:scale-110"
          title="Sản phẩm tiếp theo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

        {/* Carousel Pagination Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  index === selectedIndex
                    ? "bg-[#80BF49] w-8"
                    : "bg-gray-300 hover:bg-gray-400 w-2.5"
                }`}
                title={`Chuyển đến slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-10">
          <Link
            href="/san-pham"
            className="flex items-center gap-2 bg-[#13426E] text-white px-8 py-3 rounded-full hover:bg-[#80BF49] hover:shadow-lg transition-all font-semibold shadow-md"
          >
            Xem tất cả sản phẩm <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Consultation Modal */}

    </section>
  );
}
