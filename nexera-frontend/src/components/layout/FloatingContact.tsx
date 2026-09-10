"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, MapPin, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { NexeraChatWidget } from "@/components/chat/NexeraChatWidget";

export function FloatingContact() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastAdminMessage, setLastAdminMessage] = useState<string>("");
  const [showTooltip, setShowTooltip] = useState(false);

  const handleUnreadChange = (count: number, lastMessage?: string) => {
    setUnreadCount(count);
    if (lastMessage) {
      setLastAdminMessage(lastMessage);
      setShowTooltip(true);
    }
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0);
    setShowTooltip(false);
  };

  return (
    <>
      <NexeraChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onUnreadChange={handleUnreadChange}
      />

      {/* Speed Dial / Floating Buttons - Smoothly hidden when chat is open */}
      <div 
        className={`fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:gap-3 transition-all duration-300 ease-out ${
          isChatOpen 
            ? "opacity-0 scale-90 pointer-events-none translate-y-4" 
            : "opacity-100 scale-100 pointer-events-auto translate-y-0"
        }`}
      >
        {/* Unread Message Preview Tooltip */}
        {showTooltip && unreadCount > 0 && !isChatOpen && (
          <div className="bg-white text-gray-800 rounded-2xl p-3 shadow-2xl border border-[#d4e6f1] w-64 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200 mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#13426e] flex items-center gap-1.5 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-[#80bf49] animate-pulse" />
                NEXERA phản hồi:
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                title="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p 
              onClick={handleOpenChat} 
              className="text-gray-600 text-[11px] line-clamp-2 cursor-pointer hover:text-[#13426e] leading-relaxed"
            >
              {lastAdminMessage || "Bạn có tin nhắn mới từ tư vấn viên..."}
            </p>
            <button
              onClick={handleOpenChat}
              className="mt-2 w-full py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white text-[11px] font-semibold rounded-xl text-center transition-colors shadow-xs"
            >
              Xem câu trả lời ngay
            </button>
          </div>
        )}

        {/* Nút Chat Trực Tiếp Nexera */}
        <div className="relative group">
          <button
            onClick={handleOpenChat}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative bg-gradient-to-tr from-[#13426e] via-[#1e5a92] to-[#256bb0] shadow-blue-900/30 cursor-pointer"
            aria-label="Nhắn tin với tư vấn viên Nexera"
            title="Nhắn tin trực tiếp với tư vấn viên"
          >
            <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            
            {/* Unread Count Badge */}
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white text-[11px] font-extrabold border-2 border-white rounded-full flex items-center justify-center shadow-md animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#80bf49] border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            )}
          </button>
          
          {/* Tooltip on desktop */}
          <span className="hidden sm:block absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Tư vấn trực tuyến
          </span>
        </div>

        {/* Zalo */}
        <div className="relative group">
          <Link
            href={`https://zalo.me/${siteConfig.company.phone.replace(/\D/g, '')}`}
            target="_blank"
            className="w-11 h-11 sm:w-12 sm:h-12 bg-[#0068ff] rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Liên hệ qua Zalo"
          >
            <span className="font-bold text-[11px] sm:text-[12px] tracking-tight">Zalo</span>
          </Link>
          <span className="hidden sm:block absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Chat qua Zalo
          </span>
        </div>

        {/* Map */}
        <div className="relative group">
          <Link
            href={siteConfig.company.mapUrl}
            target="_blank"
            className="w-11 h-11 sm:w-12 sm:h-12 bg-[#34a853] rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Chỉ đường trên Google Maps"
          >
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <span className="hidden sm:block absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Địa chỉ Showroom
          </span>
        </div>

        {/* Hotline */}
        <div className="relative group">
          <Link
            href={`tel:${siteConfig.company.phone.replace(/\D/g, '')}`}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-[#e11d48] rounded-full flex items-center justify-center text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 animate-shake"
            aria-label="Gọi Hotline"
          >
            <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
          <span className="hidden sm:block absolute right-14 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900/90 text-white text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            Hotline: {siteConfig.company.phone}
          </span>
        </div>
      </div>
    </>
  );
}
