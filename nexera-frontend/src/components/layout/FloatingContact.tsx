"use client";

import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import { siteConfig } from "@/config/site";

export function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Facebook/Messenger */}
      <Link
        href={siteConfig.social.facebook}
        target="_blank"
        className="w-14 h-14 bg-[#0084ff] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
        aria-label="Liên hệ qua Facebook"
      >
        <MessageCircle className="w-7 h-7" />
      </Link>

      {/* Zalo */}
      <Link
        href="https://zalo.me/your-zalo-id" // Replace with actual Zalo link
        target="_blank"
        className="w-14 h-14 bg-[#0068ff] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
        aria-label="Liên hệ qua Zalo"
      >
        <span className="font-bold text-[12px]">Zalo</span>
      </Link>

      {/* Hotline (Shaking Red Phone) */}
      <Link
        href={`tel:${siteConfig.company.phone.replace(/\D/g, '')}`}
        className="w-14 h-14 bg-[#ff0000] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform animate-shake"
        aria-label="Gọi Hotline"
      >
        <Phone className="w-7 h-7" />
      </Link>
    </div>
  );
}
