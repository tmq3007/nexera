"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, Tags, Zap, BadgeDollarSign, ChevronRight, ChevronLeft, ShoppingCart, Eye, Scale, Plus, Check, X, ArrowLeftRight, Minus } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export function ProductCatalog({ initialProducts, categories }: { initialProducts: any[], categories: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  // URL State
  const urlCategory = searchParams.get("category");
  const urlPrice = searchParams.get("price");
  const urlType = searchParams.get("type");
  const urlQuery = searchParams.get("q");

  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(urlPrice);
  const [selectedType, setSelectedType] = useState<string | null>(urlType);
  const [searchQuery, setSearchQuery] = useState<string>(urlQuery || "");

  // UX Features State
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [activeSpecsProduct, setActiveSpecsProduct] = useState<any | null>(null);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [isCompareDockHidden, setIsCompareDockHidden] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category"));
    setSelectedPrice(searchParams.get("price"));
    setSelectedType(searchParams.get("type"));
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const updateUrl = (params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/san-pham?${newParams.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchQuery });
  };

  // Compare Logic
  const toggleCompare = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const exists = compareList.find(p => p.id === product.id);
    if (exists) {
      setCompareList(compareList.filter(p => p.id !== product.id));
      toast.info(`Đã xoá ${product.name} khỏi so sánh`);
    } else {
      // Check category logic: Only allow comparing products of the same category
      if (compareList.length > 0 && compareList[0].category_id !== product.category_id) {
        toast.error("Bạn chỉ có thể so sánh các sản phẩm cùng danh mục!");
        return;
      }

      if (compareList.length >= 3) {
        toast.error("Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc.");
        return;
      }
      setCompareList([...compareList, product]);
      setIsCompareDockHidden(false); // Auto show dock when adding
      toast.success(`Đã thêm ${product.name} vào so sánh`);
    }
  };

  const clearCompare = () => {
    setCompareList([]);
    setShowCompareModal(false);
    toast.info("Đã xoá danh sách so sánh");
  };

  // Filter Logic
  const filteredProducts = initialProducts.filter((p) => {
    let matches = true;
    if (selectedCategory && selectedCategory !== "all") {
      const cat = categories.find(c => c.slug === selectedCategory);
      if (cat && p.category_id !== cat.id) matches = false;
    }
    if (selectedType && selectedType !== "all") {
      if (p.type !== selectedType) matches = false;
    }
    if (selectedPrice && selectedPrice !== "all") {
      if (selectedPrice === "under-10" && p.price >= 10000000) matches = false;
      else if (selectedPrice === "10-50" && (p.price < 10000000 || p.price > 50000000)) matches = false;
      else if (selectedPrice === "over-50" && p.price <= 50000000) matches = false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) matches = false;
    }
    return matches;
  });

  // Pagination Logic
  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedType, selectedPrice, searchQuery]);

  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* ================= LEFT SIDEBAR (STICKY) ================= */}
      <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full pr-1">
        
        {/* Search */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#13426E] mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#80BF49]" />
            Tìm kiếm
          </h3>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input 
              type="text" 
              placeholder="Tên sản phẩm..."
              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#13426E] focus:border-[#13426E] transition-colors text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#13426E] transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#13426E] mb-4 flex items-center gap-2">
            <Tags className="w-4 h-4 text-[#80BF49]" />
            Danh mục
          </h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => updateUrl({ category: "all" })}
              className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                !selectedCategory || selectedCategory === "all" 
                  ? "bg-[#13426E] text-white font-medium shadow-sm" 
                  : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-[#13426E]"
              }`}
            >
              Tất cả danh mục
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => updateUrl({ category: cat.slug })}
                className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                  selectedCategory === cat.slug 
                    ? "bg-[#13426E] text-white font-medium shadow-sm" 
                    : "bg-transparent text-gray-600 hover:bg-gray-50 hover:text-[#13426E]"
                }`}
              >
                {cat.name}
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedCategory === cat.slug ? "translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Product Type */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#13426E] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#80BF49]" />
            Loại hình
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Tất cả" },
              { id: "EQUIPMENT", label: "Thiết bị" },
              { id: "PACKAGE", label: "Trọn gói" },
            ].map((type) => {
              const isActive = (selectedType || "all") === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => updateUrl({ type: type.id })}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#13426E] text-white font-medium shadow-sm"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-[#13426E] mb-4 flex items-center gap-2">
            <BadgeDollarSign className="w-4 h-4 text-[#80BF49]" />
            Khoảng giá
          </h3>
          <div className="flex flex-col gap-1.5">
            {[
              { id: "all", label: "Tất cả các mức giá" },
              { id: "under-10", label: "Dưới 10 triệu VNĐ" },
              { id: "10-50", label: "Từ 10 - 50 triệu VNĐ" },
              { id: "over-50", label: "Trên 50 triệu VNĐ" },
            ].map((price) => {
              const isActive = (selectedPrice || "all") === price.id;
              return (
                <button
                  key={price.id}
                  onClick={() => updateUrl({ price: price.id })}
                  className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-[#13426E]/10 text-[#13426E] font-medium border border-[#13426E]/20"
                      : "bg-transparent text-gray-600 hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  {price.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE: PRODUCT GRID ================= */}
      <div className="lg:col-span-9 flex flex-col min-h-[60vh] lg:min-h-[1200px]">
        {/* Results Info */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
               <Filter className="w-4 h-4 text-gray-500" />
             </div>
             <p className="text-gray-600 text-sm">
               Tìm thấy <strong className="text-[#13426E] text-base mx-1">{filteredProducts.length}</strong> sản phẩm phù hợp
             </p>
           </div>
        </div>

        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 content-start flex-1">
              {currentProducts.map((product: any) => {
                const isCompared = compareList.find(p => p.id === product.id);
                return (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden flex flex-col group transition-all border border-gray-100 relative">
                    
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] bg-gray-50 p-6 flex items-center justify-center group/img overflow-hidden border-b border-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image_url || "/doi.png"} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover/img:scale-105 transition-transform duration-500" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        {/* Type Badge */}
                        <div className="bg-white text-[#13426E] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-gray-200 shadow-sm flex items-center gap-1.5">
                          {product.type === "EQUIPMENT" ? <Zap className="w-3 h-3 text-[#80BF49]"/> : <ShoppingCart className="w-3 h-3 text-[#80BF49]" />}
                          {product.type === "EQUIPMENT" ? "Thiết bị" : "Trọn gói"}
                        </div>
                        
                        {/* Discount Badge */}
                        {product.discount_rate > 0 && (
                          <div className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm w-fit">
                            -{product.discount_rate}%
                          </div>
                        )}
                      </div>

                      {/* Hover Overlay - Actions */}
                      <div className="absolute inset-0 bg-[#13426E]/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] z-20">
                        <div className="flex items-center gap-3 transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-300">
                          
                          {/* Quick View Button */}
                          <div className="relative group/btn">
                            <button 
                              onClick={() => setQuickViewProduct(product)}
                              className="w-10 h-10 bg-white text-[#13426E] rounded-full shadow-lg flex items-center justify-center hover:bg-[#13426E] hover:text-white transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Tooltip */}
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md">
                              Xem nhanh
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </span>
                          </div>

                          {/* Compare Button */}
                          <div className="relative group/btn">
                            <button 
                              onClick={(e) => toggleCompare(product, e)}
                              className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                                isCompared 
                                  ? "bg-[#13426E] text-white" 
                                  : "bg-white text-[#13426E] hover:bg-[#13426E] hover:text-white"
                              }`}
                            >
                              <Scale className="w-4 h-4" />
                              {isCompared && <Check className="w-3 h-3 absolute -bottom-1 -right-1 bg-[#80BF49] rounded-full text-white border border-white" />}
                            </button>
                            {/* Tooltip */}
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium shadow-md z-30">
                              {isCompared ? "Bỏ so sánh" : "So sánh"}
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-base font-semibold text-[#13426E] mb-2 group-hover:text-[#80BF49] transition-colors line-clamp-2" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-gray-500 mb-5 flex-1 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
                      
                      <div className="mt-auto pt-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                           <div>
                             {product.discount_rate > 0 ? (
                               <>
                                 <div className="text-lg font-bold text-red-600">
                                   {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price - (product.price * product.discount_rate / 100))}
                                 </div>
                                 <div className="text-xs text-gray-400 line-through mt-0.5">
                                   {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                                 </div>
                               </>
                             ) : (
                               <div className="text-lg font-bold text-[#13426E]">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                               </div>
                             )}
                           </div>
                           <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${product.stock > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                             {product.stock > 0 ? "Còn hàng" : "Hết hàng"}
                           </span>
                        </div>
                        <button className="w-full py-2.5 bg-[#13426E] text-white rounded-lg font-medium hover:bg-[#1a5b99] shadow-sm transition-colors text-sm flex items-center justify-center gap-2">
                          Nhận báo giá
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 mb-8 flex flex-wrap items-center justify-center gap-1.5 md:gap-2 shrink-0">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-[#13426E] disabled:opacity-30 hover:bg-gray-100 transition-colors"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {(() => {
                  const getPageNumbers = () => {
                    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
                    if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
                    if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                  };

                  return getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
                    ) : (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`w-10 h-10 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                          currentPage === pageNum
                            ? "bg-[#13426E] text-white"
                            : "text-gray-600 hover:bg-gray-100 hover:text-[#13426E]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ));
                })()}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-[#13426E] disabled:opacity-30 hover:bg-gray-100 transition-colors"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 md:p-16 text-center flex flex-col items-center justify-center flex-1">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5 border border-gray-100">
               <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-[#13426E] mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-gray-500 mb-6 max-w-md text-sm">Rất tiếc, không có sản phẩm nào khớp với bộ lọc của bạn. Vui lòng thử lại với các tiêu chí khác.</p>
            <button 
              onClick={() => updateUrl({ category: null, price: null, type: null, q: null })}
              className="px-6 py-2.5 bg-[#13426E] text-white rounded-lg text-sm font-medium hover:bg-[#1a5b99] transition-colors"
            >
              Xóa bộ lọc ngay
            </button>
          </div>
        )}
      </div>

      {/* ================= MODAL: QUICK VIEW ================= */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#13426E]/50 backdrop-blur-sm transition-opacity" onClick={() => setQuickViewProduct(null)}>
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white border border-gray-200 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* Left: Image Gallery */}
            <div className="w-full md:w-1/2 bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-start border-b md:border-b-0 md:border-r border-gray-100 h-[300px] md:h-auto">
              <div className="w-full flex-1 flex items-center justify-center bg-white rounded-xl mb-4 p-4 border border-gray-200">
                <button onClick={() => setZoomedImage(activeModalImage || quickViewProduct.image_url)} className="w-full h-full cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={activeModalImage || quickViewProduct.image_url || "/doi.png"} 
                    alt={quickViewProduct.name} 
                    className="w-full h-full max-h-[250px] md:max-h-[350px] object-contain mix-blend-multiply transition-opacity duration-300 hover:scale-105" 
                  />
                </button>
              </div>
              
              {/* Thumbnails */}
              {quickViewProduct.images && Array.isArray(quickViewProduct.images) && quickViewProduct.images.length > 0 && (
                <div className="flex items-center justify-center gap-3 w-full overflow-x-auto py-2 custom-scrollbar shrink-0">
                  {quickViewProduct.images.map((img: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveModalImage(img.url)}
                      className={`w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 p-1 bg-white shrink-0 transition-all ${
                        (activeModalImage || quickViewProduct.image_url) === img.url 
                          ? "border-[#13426E] opacity-100 shadow-md" 
                          : "border-gray-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Right: Details */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col h-[50vh] md:h-auto overflow-hidden">
              <div className="mb-3 shrink-0">
                <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                  {quickViewProduct.type === "EQUIPMENT" ? "Thiết bị" : "Gói lắp đặt"}
                </span>
                {quickViewProduct.brand && (
                  <span className="ml-2 inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#13426E]/10 text-[#13426E] border border-[#13426E]/20">
                    {quickViewProduct.brand}
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 shrink-0">{quickViewProduct.name}</h2>
              
              <div className="flex items-end gap-3 mb-4 shrink-0">
                <div className="text-3xl font-bold text-[#E30019]">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(quickViewProduct.price)}
                </div>
                {quickViewProduct.discount_rate > 0 && (
                  <div className="text-gray-400 line-through text-sm mb-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      quickViewProduct.price / (1 - quickViewProduct.discount_rate / 100)
                    )}
                  </div>
                )}
              </div>
              
              <div className="h-px w-full bg-gray-100 mb-4 shrink-0"></div>
              
              {/* Product Specifications Table */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-6">
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {quickViewProduct.description}
                </p>
                
                {quickViewProduct.specifications && Object.keys(quickViewProduct.specifications).length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        {Object.entries(quickViewProduct.specifications).map(([key, value], idx) => (
                          <tr key={key} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                            <td className="px-4 py-3 font-medium text-gray-900 border-b border-gray-100 w-1/3">{key}</td>
                            <td className="px-4 py-3 text-gray-600 border-b border-gray-100">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                <button className="flex-1 py-3 bg-[#13426E] text-white rounded-lg text-sm font-medium hover:bg-[#1a5b99] transition-colors flex items-center justify-center gap-2">
                  Đăng ký tư vấn
                </button>
                <button 
                  onClick={() => toggleCompare(quickViewProduct)}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                    compareList.find(p => p.id === quickViewProduct.id) 
                      ? "bg-[#13426E] border-[#13426E] text-white" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-[#13426E] hover:text-[#13426E]"
                  }`}
                  title="So sánh"
                >
                  <Scale className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM DOCK: COMPARE ================= */}
      {compareList.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none transition-transform duration-300 ease-in-out ${isCompareDockHidden ? 'translate-y-[calc(100%-40px)]' : 'translate-y-0'}`}>
          <div className="bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] border border-gray-200 rounded-t-xl pointer-events-auto flex flex-col overflow-hidden max-w-4xl w-full mx-4">
            
            {/* Dock Header (Click to toggle) */}
            <div 
              className="bg-[#13426E] text-white px-5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#1a5b99] transition-colors"
              onClick={() => setIsCompareDockHidden(!isCompareDockHidden)}
            >
              <span className="font-medium text-sm flex items-center gap-2">
                <Scale className="w-4 h-4" />
                So sánh sản phẩm ({compareList.length}/3)
              </span>
              <button className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                {isCompareDockHidden ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>
            </div>

            {/* Dock Body */}
            <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Product Slots */}
              <div className="flex gap-3 flex-1 w-full justify-center md:justify-start overflow-x-auto pb-2 md:pb-0">
                {[0, 1, 2].map(index => {
                  const p = compareList[index];
                  return (
                    <div key={index} className="w-[100px] md:w-[130px] shrink-0">
                      {p ? (
                        <div className="relative bg-white rounded-lg border border-gray-200 p-2 flex flex-col items-center group shadow-sm">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleCompare(p); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 text-gray-500 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image_url || "/doi.png"} alt={p.name} className="w-12 h-12 md:w-16 md:h-16 object-contain mix-blend-multiply mb-2" />
                          <p className="text-[10px] md:text-xs text-center font-medium text-gray-700 line-clamp-2" title={p.name}>{p.name}</p>
                        </div>
                      ) : (
                        <div className="h-full min-h-[80px] md:min-h-[100px] border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 gap-1 bg-gray-50">
                          <Plus className="w-5 h-5 opacity-50" />
                          <span className="text-[10px] font-medium opacity-70">Thêm SP</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex md:flex-col gap-2 shrink-0 w-full md:w-auto">
                <button 
                  onClick={() => setShowCompareModal(true)}
                  disabled={compareList.length < 2}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-[#13426E] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#1a5b99] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  So sánh ngay
                </button>
                <button 
                  onClick={clearCompare}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors text-sm font-medium"
                >
                  Xoá tất cả
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: COMPARE DETAILS ================= */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-[#13426E]/50 backdrop-blur-sm transition-opacity" onClick={() => setShowCompareModal(false)}>
          <div className="bg-white w-full max-w-7xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
            <h2 className="text-xl md:text-2xl font-bold text-[#13426E] flex items-center gap-2 md:gap-3">
              <Scale className="w-6 h-6 text-[#13426E]" />
              So sánh chi tiết
            </h2>
            <button 
              onClick={() => setShowCompareModal(false)}
              className="p-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-[800px] table-fixed">
                <tbody>
                  {/* Images & Delete */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 w-1/4 font-medium text-gray-600 text-sm md:text-base border-r border-gray-100">Sản phẩm</th>
                    {compareList.map((p) => (
                      <td key={`img-${p.id}`} className="p-4 md:p-6 text-center border-r border-gray-100 last:border-0 relative group w-1/4">
                        <button 
                          onClick={() => {
                            const newList = compareList.filter(item => item.id !== p.id);
                            setCompareList(newList);
                            if (newList.length < 2) setShowCompareModal(false);
                            toast.info(`Đã xoá ${p.name}`);
                          }}
                          className="absolute top-2 right-2 md:top-4 md:right-4 w-6 h-6 md:w-8 md:h-8 bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-full flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          title="Xoá khỏi so sánh"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                        <button onClick={() => setZoomedImage(p.image_url)} className="cursor-zoom-in block mx-auto hover:scale-105 transition-transform">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.image_url || "/doi.png"} alt={p.name} className="w-24 h-24 md:w-32 md:h-32 mx-auto object-contain mix-blend-multiply mb-3 md:mb-4" />
                        </button>
                        <h3 className="font-semibold text-[#13426E] text-sm md:text-base">{p.name}</h3>
                      </td>
                    ))}
                    {/* Fill empty columns if < 3 items */}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                       <td key={`empty-${i}`} className="p-4 md:p-6 text-center border-r border-gray-100 bg-gray-50/50 w-1/4"></td>
                    ))}
                  </tr>

                  {/* Price */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Giá tham khảo</th>
                    {compareList.map(p => (
                      <td key={`price-${p.id}`} className="p-4 md:p-6 text-base md:text-lg font-bold text-[#13426E] border-r border-gray-100 last:border-0">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Type */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Loại hình</th>
                    {compareList.map(p => (
                      <td key={`type-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                          {p.type === "EQUIPMENT" ? "Thiết bị lẻ" : "Trọn gói"}
                        </span>
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Stock */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Tình trạng</th>
                    {compareList.map(p => (
                      <td key={`stock-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0 font-medium text-sm">
                        {p.stock > 0 ? <span className="text-green-600">Còn hàng</span> : <span className="text-red-500">Liên hệ</span>}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Brand */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Thương hiệu</th>
                    {compareList.map(p => (
                      <td key={`brand-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0 text-sm font-medium">
                        {p.brand || "Đang cập nhật"}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Origin */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Nơi sản xuất</th>
                    {compareList.map(p => (
                      <td key={`origin-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0 text-sm font-medium">
                        {p.origin || "Đang cập nhật"}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Warranty */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100">Bảo hành</th>
                    {compareList.map(p => (
                      <td key={`warranty-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0 text-sm font-medium">
                        {p.warranty_info || "Đang cập nhật"}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Description */}
                  <tr className="border-b border-gray-100">
                    <th className="p-4 md:p-6 bg-gray-50 font-medium text-gray-600 text-sm border-r border-gray-100 align-top">Thông tin chung</th>
                    {compareList.map(p => (
                      <td key={`desc-${p.id}`} className="p-4 md:p-6 border-r border-gray-100 last:border-0 text-xs md:text-sm text-gray-500 leading-relaxed align-top">
                        {p.description}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={i} className="border-r border-gray-100 bg-gray-50/50"></td>)}
                  </tr>

                  {/* Cấu hình sản phẩm */}
                  <tr>
                    <th className="p-4 md:p-6 bg-[#13426E]/5 font-bold text-[#13426E] text-sm border-r border-gray-200 align-top">
                      Cấu hình sản phẩm
                    </th>
                    {compareList.map(p => (
                      <td key={`specs-cell-${p.id}`} className="p-3 md:p-5 border-r border-gray-200 last:border-0 align-top">
                        {p.specifications && Object.keys(p.specifications).length > 0 ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                              <tbody>
                                {Object.entries(p.specifications).map(([k, v], idx) => (
                                  <tr key={k} className={idx % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}>
                                    <td className="px-4 py-3 font-semibold text-gray-800 border-b border-gray-200 w-2/5 whitespace-nowrap">{k}</td>
                                    <td className="px-4 py-3 text-gray-700 font-medium border-b border-gray-200">{String(v)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Không có thông số kỹ thuật</span>
                        )}
                      </td>
                    ))}
                    {Array.from({ length: 3 - compareList.length }).map((_, i) => <td key={`empty-specs-${i}`} className="border-r border-gray-200 bg-gray-50/50"></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 md:mt-8 flex justify-center">
              <button 
                onClick={() => setShowCompareModal(false)}
                className="px-6 py-2.5 md:px-8 md:py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium shadow-sm transition-colors text-sm md:text-base"
              >
                Đóng bảng so sánh
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ================= LIGHTBOX / IMAGE ZOOM MODAL ================= */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md transition-opacity cursor-zoom-out" 
          onClick={() => setZoomedImage(null)}
        >
          <button 
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center transition-colors shadow-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={zoomedImage || "/doi.png"} 
            alt="Zoomed" 
            className="max-w-full max-h-full object-contain select-none shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()} // Keep it open if clicking the image itself, or remove this to close on any click
          />
        </div>
      )}

    </div>
  );
}
