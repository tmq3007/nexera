"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Newspaper,
  FolderKanban,
  Tags,
  User,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { label: "Danh mục", href: "/admin/danh-muc", icon: Tags },
  { label: "Sản phẩm", href: "/admin/san-pham", icon: Package },
  { label: "Đơn hàng", href: "/admin/don-hang", icon: ShoppingCart },
  { label: "Yêu cầu tư vấn", href: "/admin/leads", icon: MessageSquare },
  { label: "Khách hàng", href: "/admin/khach-hang", icon: Users },
  { label: "Bài viết", href: "/admin/bai-viet", icon: Newspaper },
  { label: "Dự án", href: "/admin/du-an", icon: FolderKanban },
  { label: "Quản lý tài khoản", href: "/admin/tai-khoan", icon: ShieldCheck },
  { label: "Vai trò & Phân quyền", href: "/admin/vai-tro", icon: Lock },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/dang-nhap/admin");
    router.refresh();
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } bg-[var(--accent)] text-white flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      {/* Logo - Link về trang chủ */}
      <div className="h-16 flex items-center px-3 border-b border-white/10">
        <Link href="/" className="flex items-center justify-center w-full" title="Về trang chủ">
          {!collapsed ? (
            <span className="font-bold text-2xl tracking-wider text-white">NEXERA</span>
          ) : (
            <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center font-bold text-white text-sm mx-auto">
              N
            </div>
          )}
        </Link>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center text-white shadow-md hover:bg-[var(--primary-light)] transition-colors z-10"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      <div className="p-3 border-t border-white/10 mt-auto">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">{userEmail || "Admin"}</span>
                <span className="text-[10px] text-white/40">Quản trị viên</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
