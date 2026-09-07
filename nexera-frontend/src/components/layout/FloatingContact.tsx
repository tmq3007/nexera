"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, MapPin, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { NexeraChatWidget } from "@/components/chat/NexeraChatWidget";

export function FloatingContact() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <>
      <NexeraChatWidget 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Nút Chat Trực Tiếp Nexera (Tận dụng icon chat có sẵn) */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all relative ${
            isChatOpen ? "bg-[#13426e] rotate-90" : "bg-[#0084ff] animate-shake"
          }`}
          aria-label="Nhắn tin với tư vấn viên Nexera"
          title="Nhắn tin với tư vấn viên Nexera"
        >
          {isChatOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#80bf49] border-2 border-white rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            </>
          )}
        </button>

        {/* Zalo */}
        <Link
          href="https://zalo.me/your-zalo-id" // Replace with actual Zalo link
          target="_blank"
          className="w-14 h-14 bg-[#0068ff] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
          aria-label="Liên hệ qua Zalo"
        >
          <span className="font-bold text-[12px]">Zalo</span>
        </Link>

        {/* Map */}
        <Link
          href={siteConfig.company.mapUrl}
          target="_blank"
          className="w-14 h-14 bg-[#34a853] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
          aria-label="Chỉ đường trên Google Maps"
        >
          <MapPin className="w-7 h-7" />
        </Link>

        {/* Hotline (Shaking Red Phone) */}
        <Link
          href={`tel:${siteConfig.company.phone.replace(/\\D/g, '')}`}
          className="w-14 h-14 bg-[#ff0000] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
          aria-label="Gọi Hotline"
        >
          <Phone className="w-7 h-7" />
        </Link>
      </div>
    </>
  );
}
