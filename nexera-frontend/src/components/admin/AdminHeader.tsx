"use client";

import { Bell, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

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

export function AdminHeader() {
  const pathname = usePathname();

  // Tìm tiêu đề phù hợp nhất
  const title =
    Object.entries(pageTitles).find(
      ([path]) => pathname === path || (path !== "/admin" && pathname.startsWith(path))
    )?.[1] ?? "Quản Trị Hệ Thống";

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-xs">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] w-72 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 bg-[var(--primary)] rounded-full flex items-center justify-center font-bold text-white shadow-sm">
            A
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-gray-800 leading-tight">Admin</p>
            <p className="text-[11px] text-gray-400 font-medium">Hệ thống Nexera</p>
          </div>
        </div>
      </div>
    </header>
  );
}
