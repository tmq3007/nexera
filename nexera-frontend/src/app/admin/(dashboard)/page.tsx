import { createClient } from "@/utils/supabase/server";
import {
  Package,
  ShoppingCart,
  MessageSquare,
  Newspaper,
  FolderKanban,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Lấy số liệu thống kê tổng quan
  const [
    { count: productCount },
    { count: orderCount },
    { count: leadCount },
    { count: articleCount },
    { count: projectCount },
    { count: customerCount },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Sản phẩm",
      value: productCount ?? 0,
      icon: Package,
      href: "/admin/san-pham",
      color: "bg-blue-500",
    },
    {
      label: "Đơn hàng",
      value: orderCount ?? 0,
      icon: ShoppingCart,
      href: "/admin/don-hang",
      color: "bg-green-500",
    },
    {
      label: "Yêu cầu tư vấn",
      value: leadCount ?? 0,
      icon: MessageSquare,
      href: "/admin/leads",
      color: "bg-orange-500",
    },
    {
      label: "Khách hàng",
      value: customerCount ?? 0,
      icon: Users,
      href: "/admin/khach-hang",
      color: "bg-purple-500",
    },
    {
      label: "Bài viết",
      value: articleCount ?? 0,
      icon: Newspaper,
      href: "/admin/bai-viet",
      color: "bg-cyan-500",
    },
    {
      label: "Dự án",
      value: projectCount ?? 0,
      icon: FolderKanban,
      href: "/admin/du-an",
      color: "bg-pink-500",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-gray-500 mt-1">
          Chào mừng bạn đến với bảng điều khiển quản trị NEXERA
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stat.value}
                </p>
              </div>
              <div
                className={`${stat.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/san-pham/them-moi"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white transition-colors group"
          >
            <Package className="w-5 h-5 text-[var(--primary)] group-hover:text-white" />
            <span className="font-medium">Thêm sản phẩm mới</span>
          </Link>
          <Link
            href="/admin/bai-viet/them-moi"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white transition-colors group"
          >
            <Newspaper className="w-5 h-5 text-[var(--primary)] group-hover:text-white" />
            <span className="font-medium">Viết bài mới</span>
          </Link>
          <Link
            href="/admin/leads"
            className="flex items-center gap-3 p-4 rounded-lg bg-[var(--surface)] hover:bg-[var(--primary)] hover:text-white transition-colors group"
          >
            <MessageSquare className="w-5 h-5 text-[var(--primary)] group-hover:text-white" />
            <span className="font-medium">Xem yêu cầu tư vấn</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
