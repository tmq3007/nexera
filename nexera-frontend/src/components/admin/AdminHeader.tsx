"use client";

import { Bell, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/san-pham": "Quản lý Sản phẩm",
  "/admin/don-hang": "Quản lý Đơn hàng",
  "/admin/leads": "Yêu cầu Tư vấn",
  "/admin/khach-hang": "Quản lý Khách hàng",
  "/admin/bai-viet": "Quản lý Bài viết",
  "/admin/du-an": "Quản lý Dự án",
};

export function AdminHeader() {
  const pathname = usePathname();

  // Tìm tiêu đề phù hợp nhất
  const title =
    Object.entries(pageTitles).find(
      ([path]) => pathname === path || (path !== "/admin" && pathname.startsWith(path))
    )?.[1] ?? "Quản trị";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] w-64 transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
