"use client";

import { Bell, Search, Menu } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/admin": "Tổng Quan Hệ Thống",
  "/admin/san-pham": "Quản Lý Sản Phẩm",
  "/admin/danh-muc": "Quản Lý Danh Mục",
  "/admin/don-hang": "Quản Lý Đơn Hàng",
  "/admin/leads": "Yêu Cầu Tư Vấn (CRM)",
  "/admin/khach-hang": "Quản Lý Khách Hàng",
  "/admin/bai-viet": "Quản Lý Bài Viết",
  "/admin/du-an": "Quản Lý Dự Án",
  "/admin/tai-khoan": "Quản Lý Tài Khoản",
  "/admin/vai-tro": "Vai Trò & Phân Quyền",
};

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState("");

  // Sync search input with URL on load or navigation
  useEffect(() => {
    const q = searchParams.get("q");
    setSearchTerm(q || "");
  }, [searchParams, pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      params.set("q", searchTerm.trim());
    } else {
      params.delete("q");
    }
    // Always reset page to 1 on a new search
    params.delete("page");
    
    router.push(`${pathname}?${params.toString()}`);
  };

  // Tìm tiêu đề phù hợp nhất
  const title =
    Object.entries(pageTitles).find(
      ([path]) => pathname === path || (path !== "/admin" && pathname.startsWith(path))
    )?.[1] ?? "Quản Trị Hệ Thống";

  return (
    <header className="h-14 md:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shadow-xs shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger button — mobile only */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 tracking-tight truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <button type="submit" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--primary)] transition-colors">
            <Search className="w-4.5 h-4.5" />
          </button>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Tìm trong ${title.toLowerCase()}...`}
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] w-72 transition-all"
          />
        </form>

        {/* Notifications */}
        <button className="relative p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

      </div>
    </header>
  );
}
