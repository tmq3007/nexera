import { createClient } from "@/utils/supabase/server";
import { RevenueChart } from "@/components/admin/RevenueChart";
import {
  Package,
  ShoppingCart,
  MessageSquare,
  Newspaper,
  FolderKanban,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Plus,
  Eye,
  Phone,
  ShieldCheck,
  Zap,
  Award,
  BarChart3,
  Calendar,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import Link from "next/link";

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-amber-50 text-amber-700 border-amber-200" },
  PAID: { label: "Đã thanh toán", color: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED: { label: "Đang giao", color: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED: { label: "Hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const leadStatusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Mới", color: "bg-blue-50 text-blue-700 border-blue-200" },
  CONTACTED: { label: "Đã liên hệ", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESOLVED: { label: "Đã xử lý", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Truy vấn dữ liệu thực tế từ Supabase
  const [
    { count: productCount },
    { count: orderCount },
    { count: pendingOrderCount },
    { count: leadCount },
    { count: newLeadCount },
    { count: articleCount },
    { count: projectCount },
    { count: customerCount },
    { count: lowStockCount },
    { data: recentOrders },
    { data: recentLeads },
    { data: paidOrders },
    { data: recentProducts },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "NEW"),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }).lte("stock", 5),
    supabase.from("orders").select("id, status, total_amount, created_at, customers(full_name, phone)").order("created_at", { ascending: false }).limit(5),
    supabase.from("leads").select("id, name, phone, email, status, message, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("total_amount").in("status", ["PAID", "COMPLETED"]),
    supabase.from("products").select("id, name, price, stock, images").order("created_at", { ascending: false }).limit(5),
  ]);

  // Tính tổng doanh thu
  const totalRevenue = paidOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) ?? 0;

  // Giả lập dữ liệu đồ thị doanh thu 7 ngày gần đây
  const chartDays = [
    { day: "T2", amount: totalRevenue * 0.08 },
    { day: "T3", amount: totalRevenue * 0.12 },
    { day: "T4", amount: totalRevenue * 0.15 },
    { day: "T5", amount: totalRevenue * 0.10 },
    { day: "T6", amount: totalRevenue * 0.22 },
    { day: "T7", amount: totalRevenue * 0.18 },
    { day: "CN", amount: totalRevenue * 0.15 },
  ];
  const maxChartAmount = Math.max(...chartDays.map(d => d.amount), 1);

  return (
    <div className="space-y-8 pb-16">
      {/* 1. TikTok Shop Style Top Header Banner */}
      <div className="bg-gradient-to-r from-[#13426E] via-[#1a5187] to-[#13426E] text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-[#13426E]/10 relative overflow-hidden">
        {/* Subtle Decorative Accents */}
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-[#80BF49]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Trung tâm Quản trị & Điều hành cửa hàng
            </h1>
            <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
              Cập nhật dữ liệu kinh doanh realtime, theo dõi vận đơn và phản hồi tư vấn khách hàng tức thì.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 px-4 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#80BF49]" />
              <span className="text-xs font-medium text-white">Hôm nay: {new Date().toLocaleDateString("vi-VN")}</span>
            </div>
            <Link
              href="/admin/san-pham?action=create"
              className="flex items-center gap-2 bg-[#80BF49] hover:bg-[#9ad166] text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-[#80BF49]/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Đăng sản phẩm mới</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TikTok Shop "Việc cần làm" (To-Do List / Exception Cards) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-[#80BF49] rounded-full" />
            <h2 className="text-lg font-bold text-[#13426E]">Việc cần làm (Cần xử lý ngay)</h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">Tự động cập nhật mỗi 30s</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Đơn chờ xử lý */}
          <Link
            href="/admin/don-hang?status=PENDING"
            className="bg-white hover:bg-amber-50/50 p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đơn chờ xác nhận</span>
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-gray-800">{pendingOrderCount ?? 0}</p>
              {pendingOrderCount ? (
                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">Khẩn cấp</span>
              ) : (
                <span className="text-xs text-gray-400">Đã sạch</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between group-hover:text-amber-700 font-medium">
              Xử lý đơn hàng <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>

          {/* Card 2: Leads mới chưa gọi */}
          <Link
            href="/admin/leads?status=NEW"
            className="bg-white hover:bg-blue-50/50 p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tư vấn mới gửi</span>
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-110 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-gray-800">{newLeadCount ?? 0}</p>
              {newLeadCount ? (
                <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">Mới</span>
              ) : (
                <span className="text-xs text-gray-400">Đã phản hồi</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between group-hover:text-blue-700 font-medium">
              Gọi lại cho khách <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>

          {/* Card 3: Sản phẩm sắp hết hàng */}
          <Link
            href="/admin/san-pham"
            className="bg-white hover:bg-rose-50/50 p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tồn kho báo động</span>
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-110 transition-transform">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-gray-800">{lowStockCount ?? 0}</p>
              {(lowStockCount ?? 0) > 0 ? (
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">Kho ≤ 5</span>
              ) : (
                <span className="text-xs text-emerald-600 font-medium">Dạt dào kho</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between group-hover:text-rose-700 font-medium">
              Nhập thêm hàng <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>

          {/* Card 4: Tổng khách hàng */}
          <Link
            href="/admin/khach-hang"
            className="bg-white hover:bg-emerald-50/50 p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng tích cực</span>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <p className="text-2xl font-extrabold text-gray-800">{customerCount ?? 0}</p>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Thành viên</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center justify-between group-hover:text-emerald-700 font-medium">
              Xem CRM Khách hàng <ChevronRight className="w-3.5 h-3.5" />
            </p>
          </Link>
        </div>
      </div>

      {/* 3. TikTok Shop "Chỉ số kinh doanh & Đồ thị doanh thu" (Performance Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3): Revenue & Performance Chart */}
        <div className="lg:col-span-2">
          <RevenueChart totalRevenue={totalRevenue} orderCount={orderCount ?? 0} />
        </div>

        {/* Right Column (1/3): Top Ranking Products & Quick Shortcuts */}
        <div className="space-y-6">
          {/* TikTok Style Ranked Best Sellers */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#13426E] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Top Sản phẩm mới nhất
              </h2>
              <Link href="/admin/san-pham" className="text-xs font-bold text-[#80BF49] hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {(!recentProducts || recentProducts.length === 0) && (
                <p className="text-center py-6 text-xs text-gray-400">Chưa có sản phẩm nào.</p>
              )}
              {recentProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/60 hover:bg-gray-100/70 transition-colors">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                    index === 0 ? "bg-amber-400 text-white shadow-xs" :
                    index === 1 ? "bg-slate-300 text-slate-800" :
                    index === 2 ? "bg-amber-700/60 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-800 truncate">{product.name}</p>
                    <p className="text-[11px] text-[#80BF49] font-bold mt-0.5">
                      {Number(product.price).toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg ${
                    (product.stock ?? 0) <= 5 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    Kho: {product.stock ?? 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Creator & Content Action Shortcuts */}
          <div className="bg-gradient-to-br from-[#13426E]/5 to-[#80BF49]/10 rounded-3xl border border-[#13426E]/10 p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold text-[#13426E] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#80BF49]" /> Phím tắt quản trị nhanh
            </h3>

            <Link
              href="/admin/san-pham?action=create"
              className="flex items-center justify-between p-3.5 bg-white hover:bg-[#80BF49] hover:text-white rounded-2xl font-bold text-xs text-[#13426E] transition-all shadow-xs border border-gray-100 group"
            >
              <span className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-[#80BF49] group-hover:text-white" /> Đăng sản phẩm mới
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-50" />
            </Link>

            <Link
              href="/admin/bai-viet?action=create"
              className="flex items-center justify-between p-3.5 bg-white hover:bg-[#80BF49] hover:text-white rounded-2xl font-bold text-xs text-[#13426E] transition-all shadow-xs border border-gray-100 group"
            >
              <span className="flex items-center gap-2.5">
                <Newspaper className="w-4 h-4 text-[#80BF49] group-hover:text-white" /> Viết bài tiếp thị / tin tức
              </span>
              <ArrowUpRight className="w-4 h-4 opacity-50" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Recent Orders Table & Recent Leads Widgets (TikTok Shop Live Activity Stream) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Orders Stream */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#13426E] flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" /> Đơn hàng mới đặt realtime
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Danh sách các giao dịch phát sinh vừa xong</p>
            </div>
            <Link href="/admin/don-hang" className="text-xs font-bold text-[#80BF49] hover:underline flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(!recentOrders || recentOrders.length === 0) && (
              <p className="text-center py-8 text-xs text-gray-400">Chưa có đơn hàng nào.</p>
            )}
            {recentOrders?.map((order) => {
              const status = orderStatusConfig[order.status] ?? orderStatusConfig.PENDING;
              return (
                <div key={order.id} className="p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-bold text-gray-700">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs font-semibold text-[#13426E] mt-0.5">
                      {(order.customers as any)?.full_name || "Khách hàng"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-[#13426E]">
                      {Number(order.total_amount).toLocaleString("vi-VN")} ₫
                    </p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Leads / Customer Support Requests */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-[#13426E] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Yêu cầu tư vấn mới từ khách
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Phản hồi khách hàng nhanh để tăng chuyển đổi</p>
            </div>
            <Link href="/admin/leads" className="text-xs font-bold text-[#80BF49] hover:underline flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(!recentLeads || recentLeads.length === 0) && (
              <p className="text-center py-8 text-xs text-gray-400">Chưa có yêu cầu tư vấn nào.</p>
            )}
            {recentLeads?.map((lead) => {
              const status = leadStatusConfig[lead.status] ?? leadStatusConfig.NEW;
              return (
                <div key={lead.id} className="p-4 bg-gray-50/50 hover:bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-800">{lead.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {lead.phone && (
                    <p className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-500" /> {lead.phone}
                    </p>
                  )}
                  {lead.message && (
                    <p className="text-xs text-gray-600 line-clamp-1 italic bg-white p-2 rounded-xl border border-gray-100">
                      &ldquo;{lead.message}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
