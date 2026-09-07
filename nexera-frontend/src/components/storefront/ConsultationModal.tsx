"use client";

import { useState } from "react";
import { X, Send, Loader2, PhoneCall, CheckCircle2, MessageSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/contexts/ToastContext";

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id?: string;
    name: string;
    image_url?: string;
    price?: number;
    stock?: number;
    restock_date?: string | null;
  } | null;
}

export function ConsultationModal({ isOpen, onClose, product }: ConsultationModalProps) {
  const supabase = createClient();
  const toast = useToast();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại liên hệ!");
      return;
    }

    setLoading(true);

    const fullMessage = [
      product ? `[TƯ VẤN SẢN PHẨM: ${product.name}]` : "[YÊU CẦU TƯ VẤN CHUNG]",
      product?.stock !== undefined && product.stock <= 0 ? "-> Tình trạng: Sản phẩm đang HẾT HÀNG (Khách nhận thông báo khi có hàng)" : "",
      note.trim() ? `Lời nhắn: ${note.trim()}` : ""
    ].filter(Boolean).join("\n");

    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      message: fullMessage,
      status: "NEW"
    });

    setLoading(false);

    if (error) {
      toast.error("Gửi yêu cầu tư vấn thất bại. Vui lòng thử lại!");
    } else {
      setSubmitted(true);
      toast.success("Yêu cầu tư vấn đã được gửi thành công!");
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#13426E]/60 backdrop-blur-sm transition-opacity" onClick={handleResetAndClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#13426E] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-[#80BF49]" />
            <h3 className="font-bold text-lg">Đăng Ký Tư Vấn Sản Phẩm</h3>
          </div>
          <button 
            onClick={handleResetAndClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-green-100 text-[#80BF49] rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-[#13426E]">Gửi Yêu Cầu Thành Công!</h4>
              <p className="text-gray-600 text-sm max-w-sm mx-auto">
                Cảm ơn quý khách đã quan tâm đến <strong className="text-[#13426E]">{product?.name || "sản phẩm của Nexera"}</strong>. Đội ngũ chuyên viên tư vấn sẽ liên hệ lại với quý khách trong thời gian sớm nhất!
              </p>
              <div className="pt-4">
                <button
                  onClick={handleResetAndClose}
                  className="px-8 py-2.5 bg-[#13426E] text-white rounded-lg hover:bg-[#80BF49] transition-colors text-sm font-medium shadow-sm"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {product && (
                <div className="bg-[#F0F7FB] p-3.5 rounded-xl border border-[#d4e6f1] flex items-center gap-3.5 mb-2">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} className="w-14 h-14 object-contain bg-white rounded-lg p-1 border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400 shrink-0">
                      N/A
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Sản phẩm tư vấn</p>
                    <h4 className="font-bold text-[#13426E] text-sm line-clamp-2">{product.name}</h4>
                    {product.stock !== undefined && product.stock <= 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-600">
                          Hết hàng
                        </span>
                        {product.restock_date && (
                          <span className="text-[11px] text-amber-700 font-medium">
                            Dự kiến có hàng: {new Date(product.restock_date).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nhập họ và tên..." 
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13426E] focus:border-[#13426E] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  required 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (Zalo/SMS)..." 
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13426E] focus:border-[#13426E] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email (Không bắt buộc)
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nhap-email@example.com" 
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13426E] focus:border-[#13426E] text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Lời nhắn / Cần tư vấn chi tiết
                </label>
                <textarea 
                  rows={3} 
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú yêu cầu (ví dụ: tư vấn thông số, báo giá chiết khấu, thông báo khi hàng về)..." 
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#13426E] focus:border-[#13426E] resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <a 
                  href="tel:0123456789" 
                  className="inline-flex items-center gap-1.5 text-xs text-[#13426E] font-semibold hover:text-[#80BF49] transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#80BF49]" />
                  Hotline: 0123.456.789
                </a>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#80BF49] text-white font-medium rounded-lg hover:bg-[#9ad166] transition-colors text-sm shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? "Đang gửi..." : "Gửi tư vấn"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
