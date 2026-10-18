"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  X, 
  Phone, 
  PhoneCall, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  User,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { getBusinessInfo, BusinessInfo } from "@/utils/policies";
import { formatCurrency, getProductPriceInfo } from "@/lib/catalog/price";
import { chatApi } from "@/lib/api/chat.api";
import { useToast } from "@/contexts/ToastContext";
import type { ProductItem } from "@/types/models/product";

interface ConsultationModalProps {
  product?: ProductItem | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ConsultationModal({
  product: controlledProduct,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: ConsultationModalProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalProduct, setInternalProduct] = useState<ProductItem | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Business Info
  const [companyInfo, setCompanyInfo] = useState<BusinessInfo>({
    business_name: siteConfig.company.name,
    tax_code: siteConfig.company.taxCode,
    address: siteConfig.company.address,
    phone: siteConfig.company.phone,
    email: siteConfig.company.email,
    map_url: siteConfig.company.mapUrl,
  });

  const toast = useToast();

  const isControlled = typeof controlledIsOpen === "boolean";
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const product = controlledProduct !== undefined ? controlledProduct : internalProduct;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Load business info
  useEffect(() => {
    getBusinessInfo()
      .then((info) => {
        if (info) setCompanyInfo(info);
      })
      .catch(() => {});
  }, []);

  // Listen to global open event
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setInternalProduct(detail?.product || null);
      setIsSubmitted(false);
      setInternalIsOpen(true);
    };

    window.addEventListener("open-consultation-modal", handleOpenEvent);
    return () => {
      window.removeEventListener("open-consultation-modal", handleOpenEvent);
    };
  }, []);

  // Reset form when closed or opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Fill phone/name from localStorage if available
      try {
        const savedPhone = localStorage.getItem("nexera_chat_guest_phone") || "";
        const savedName = localStorage.getItem("nexera_chat_guest_name") || "";
        if (savedPhone) setPhone(savedPhone);
        if (savedName) setFullName(savedName);
      } catch {}
    } else {
      document.body.style.overflow = "unset";
      setIsSubmitted(false);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const phoneDigits = (companyInfo.phone || siteConfig.company.phone).replace(/\D/g, "");
  const formattedPhone = companyInfo.phone || siteConfig.company.phone;
  const zaloUrl = `https://zalo.me/${phoneDigits}`;

  // Price calculation
  const priceInfo = product ? getProductPriceInfo(product) : null;
  const isContactPrice = (product as any)?.price_display === "contact" || (product && Number(product.price) <= 0);

  // 1. Action: Mở Zalo
  const handleOpenZalo = () => {
    window.open(zaloUrl, "_blank", "noopener,noreferrer");
  };

  // 2. Action: Gọi Hotline
  const handleCallHotline = () => {
    window.location.href = `tel:${phoneDigits}`;
  };

  // 3. Action: Mở Live Chat trên Web kèm sản phẩm
  const handleOpenLiveChat = () => {
    handleClose();
    // Dispatch open chat với dữ liệu sản phẩm
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-nexera-chat", {
          detail: {
            product: product || undefined,
            initialMessage: product ? `Xin chào, tôi cần tư vấn về sản phẩm: ${product.name}` : undefined,
          },
        })
      );
    }, 150);
  };

  // 4. Action: Gửi thông tin Yêu cầu tư vấn (Lead CRM)
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCustomerPhone = phone.trim();
    if (!cleanCustomerPhone) {
      toast.error("Vui lòng nhập số điện thoại để chuyên viên liên hệ.");
      return;
    }

    setIsSubmitting(true);
    try {
      let guestSessionId = localStorage.getItem("nexera_chat_guest_session");
      if (!guestSessionId) {
        guestSessionId = "guest_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        localStorage.setItem("nexera_chat_guest_session", guestSessionId);
      }

      // Lưu vào localStorage
      localStorage.setItem("nexera_chat_guest_phone", cleanCustomerPhone);
      if (fullName.trim()) {
        localStorage.setItem("nexera_chat_guest_name", fullName.trim());
      }

      // 1. Cập nhật thông tin khách hàng vào CRM Backend
      await chatApi.identifyContact({
        guestSessionId,
        fullName: fullName.trim() || undefined,
        phone: cleanCustomerPhone,
      });

      // 2. Tạo tin nhắn thông báo lead trong hệ thống chat CRM
      const productName = product ? product.name : "Thiết bị & Giải pháp năng lượng";
      const productPrice = isContactPrice ? "Liên hệ báo giá" : priceInfo ? formatCurrency(priceInfo.discountedPrice) : "";
      const messageContent = `📌 [YÊU CẦU TƯ VẤN NHANH]\n- Khách hàng: ${fullName.trim() || "Khách quan tâm"}\n- SĐT: ${cleanCustomerPhone}\n- Sản phẩm: ${productName}${productPrice ? ` (${productPrice})` : ""}${notes.trim() ? `\n- Ghi chú: ${notes.trim()}` : ""}`;

      await chatApi.sendMessage({
        content: messageContent,
        senderType: "CUSTOMER",
        senderName: fullName.trim() || cleanCustomerPhone,
        guestSessionId,
      }).catch((e) => console.warn("Lỗi gửi tin nhắn CRM:", e));

      setIsSubmitted(true);
      toast.success("Đã tiếp nhận yêu cầu! Kỹ sư Nexera sẽ liên hệ lại với bạn ngay.");
    } catch (err: any) {
      console.error("Lỗi gửi thông tin tư vấn:", err);
      toast.error("Có lỗi xảy ra khi gửi thông tin. Vui lòng liên hệ trực tiếp qua Zalo hoặc Hotline!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#13426e] via-[#184e82] to-[#1e5a92] text-white p-4 sm:p-5 select-none overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-[#80bf49] shadow-inner">
                <Sparkles className="w-5 h-5 text-[#80bf49]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  Tư Vấn &amp; Báo Giá Kỹ Thuật
                </h3>
                <p className="text-xs text-white/80 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#80bf49] animate-pulse" />
                  Kỹ sư Nexera hỗ trợ 24/7 • Miễn phí khảo sát
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Card Sản phẩm đang quan tâm (nếu có) */}
          {product && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-3.5 flex items-center gap-3.5 shadow-2xs">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="text-xs text-gray-400 font-medium">Nexera</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {product.brand && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#80bf49] block mb-0.5">
                    {product.brand}
                  </span>
                )}
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                  {product.name}
                </h4>
                <div className="mt-1 flex items-baseline gap-2">
                  {isContactPrice ? (
                    <span className="text-xs sm:text-sm font-bold text-[#13426e]">
                      Liên hệ báo giá
                    </span>
                  ) : priceInfo ? (
                    <>
                      <span className="text-xs sm:text-sm font-black text-[#E30019]">
                        {formatCurrency(priceInfo.discountedPrice)}
                      </span>
                      {priceInfo.hasDiscount && (
                        <span className="text-[11px] text-gray-400 line-through">
                          {formatCurrency(priceInfo.originalPrice)}
                        </span>
                      )}
                    </>
                  ) : null}
                  {product.sku && (
                    <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline">
                      Mã: {product.sku}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {isSubmitted ? (
            /* Màn hình gửi thành công */
            <div className="py-6 text-center space-y-3 animate-in fade-in duration-300">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900">
                Đã Tiếp Nhận Yêu Cầu Tư Vấn!
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                Cảm ơn bạn! Chuyên viên kỹ thuật của Nexera sẽ gọi lại qua số <strong className="text-gray-900">{phone}</strong> trong vòng <strong>5 phút</strong>.
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 bg-[#13426e] hover:bg-[#1a5b99] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* KÊNH KẾT NỐI TỨC THÌ (Hotline & Zalo) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#80bf49]" />
                    Kết nối trực tiếp ngay lập tức
                  </span>
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Phản hồi &lt; 1 phút
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Nút 1: Zalo */}
                  <button
                    type="button"
                    onClick={handleOpenZalo}
                    className="p-3 sm:p-3.5 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-blue-100/40 hover:from-blue-100 hover:to-blue-200/60 transition-all text-left group flex items-start gap-3 shadow-2xs hover:shadow-sm cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#0068FF] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      Zalo
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1">
                        Chat qua Zalo
                        <ExternalLink className="w-3 h-3 text-[#0068FF] opacity-70 group-hover:opacity-100" />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                        Gửi file PDF, catalog &amp; báo giá
                      </p>
                    </div>
                  </button>

                  {/* Nút 2: Gọi Hotline */}
                  <button
                    type="button"
                    onClick={handleCallHotline}
                    className="p-3 sm:p-3.5 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50/70 to-orange-50/40 hover:from-rose-100 hover:to-orange-100/60 transition-all text-left group flex items-start gap-3 shadow-2xs hover:shadow-sm cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E30019] to-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1">
                        Gọi Hotline
                      </div>
                      <p className="text-[11px] text-[#E30019] font-bold mt-0.5">
                        {formattedPhone}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Nút phụ: Live Chat trực tiếp trên web */}
                <button
                  type="button"
                  onClick={handleOpenLiveChat}
                  className="w-full mt-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#13426e]" />
                  <span>Hoặc chat trực tiếp ngay trên website (Live Chat)</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>

              {/* PHÂN CÁCH HOẶC ĐỂ LẠI SĐT */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-white px-2.5 text-gray-400 font-semibold tracking-wider">
                    Hoặc để lại số điện thoại
                  </span>
                </div>
              </div>

              {/* FORM GỬI THÔNG TIN YÊU CẦU GỌI LẠI */}
              <form onSubmit={handleSubmitLead} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại / Zalo *"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] font-medium transition-all"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Ghi chú thêm (VD: Cần lắp cho nhà xưởng 500m2, báo giá trọn gói...)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#80bf49] focus:ring-1 focus:ring-[#80bf49] transition-all"
                />

                <button
                  type="submit"
                  disabled={isSubmitting || !phone.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#80bf49] to-[#6ea93e] hover:from-[#9ad166] hover:to-[#80bf49] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Đang gửi yêu cầu..." : "Yêu Cầu Kỹ Sư Gọi Lại Tư Vấn (Sau 5 Phút)"}
                </button>

                <p className="text-[10px] sm:text-[11px] text-gray-400 text-center leading-normal">
                  Nexera cam kết bảo mật 100% số điện thoại và không làm phiền quý khách.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
