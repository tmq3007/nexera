"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
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
  Building2,
  FileText,
  Activity,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

const navSections = [
  {
    title: "TỔNG QUAN",
    items: [
      { label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "BÁN HÀNG & KHÁCH HÀNG",
    items: [
      { label: "Đơn hàng", href: "/admin/don-hang", icon: ShoppingCart },
      { label: "Sản phẩm", href: "/admin/san-pham", icon: Package },
      { label: "Danh mục", href: "/admin/danh-muc", icon: Tags },
      { label: "Yêu cầu tư vấn", href: "/admin/leads", icon: MessageSquare },
      { label: "Hội thoại tư vấn", href: "/admin/hoi-thoai", icon: MessageCircle },
      { label: "Khách hàng", href: "/admin/khach-hang", icon: Users },
    ],
  },
  {
    title: "NỘI DUNG",
    items: [
      { label: "Bài viết", href: "/admin/bai-viet", icon: Newspaper },
      { label: "Dự án", href: "/admin/du-an", icon: FolderKanban },
    ],
  },
  {
    title: "CẤU HÌNH & HỆ THỐNG",
    items: [
      { label: "Thông tin doanh nghiệp", href: "/admin/thong-tin-doanh-nghiep", icon: Building2 },
      { label: "Quản lý chính sách", href: "/admin/chinh-sach", icon: FileText },
      { label: "Quản lý tài khoản", href: "/admin/tai-khoan", icon: ShieldCheck },
      { label: "Vai trò & Phân quyền", href: "/admin/vai-tro", icon: Lock },
      { label: "Nhật ký hoạt động", href: "/admin/nhat-ky-hoat-dong", icon: Activity },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      } bg-[var(--accent)] text-white flex flex-col transition-all duration-300 ease-in-out relative shrink-0`}
    >
      {/* Logo - Link về trang chủ */}
      <div className="h-16 flex items-center px-3 border-b border-white/10 shrink-0">
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
      <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-5">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed ? (
              <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
            ) : (
              idx > 0 && <div className="my-2 border-t border-white/10" />
            )}

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / User Info */}
      <div className="p-3 border-t border-white/10 mt-auto shrink-0">
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
