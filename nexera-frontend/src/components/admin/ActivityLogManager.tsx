"use client";

import { useState } from "react";
import { Activity, Eye, Search, X } from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFilterBar, FilterConfig } from "@/components/admin/AdminFilterBar";
import { AdminTableToolbar } from "@/components/admin/AdminTableToolbar";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { getLogActionLabel, getEntityLabel } from "@/lib/messages";

export interface ActivityLog {
  id: string;
  admin_id?: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  created_at: string;
}

interface ActivityLogManagerProps {
  logs: ActivityLog[];
  count: number;
}

const filterConfigs: FilterConfig[] = [
  {
    key: "entity_type",
    label: "Tất cả đối tượng",
    type: "select",
    options: [
      { label: "Sản phẩm (products)", value: "products" },
      { label: "Đơn hàng (orders)", value: "orders" },
      { label: "Bài viết (articles)", value: "articles" },
      { label: "Khách hàng tư vấn (leads)", value: "leads" },
      { label: "Vai trò / Phân quyền (roles)", value: "roles" },
      { label: "Hệ thống (system)", value: "system" },
    ],
  },
  {
    key: "severity",
    label: "Tất cả mức độ",
    type: "select",
    options: [
      { label: "Thông tin (INFO)", value: "INFO" },
      { label: "Cảnh báo (WARNING)", value: "WARNING" },
      { label: "Lỗi (ERROR)", value: "ERROR" },
      { label: "Nghiêm trọng (CRITICAL)", value: "CRITICAL" },
    ],
  },
];

export function ActivityLogManager({ logs, count }: ActivityLogManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 15;
  const totalPages = Math.ceil(count / pageSize);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="inline-flex px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-[11px] font-bold">Nghiêm trọng</span>;
      case "ERROR":
        return <span className="inline-flex px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[11px] font-bold">Lỗi</span>;
      case "WARNING":
        return <span className="inline-flex px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[11px] font-bold">Cảnh báo</span>;
      default:
        return <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-[11px] font-bold">Thông tin</span>;
    }
  };

  const formatDetailKey = (key: string) => {
    const map: Record<string, string> = {
      name: "Tên",
      title: "Tiêu đề",
      status: "Trạng thái",
      new_status: "Trạng thái mới",
      old_status: "Trạng thái cũ",
      price: "Giá bán",
      import_price: "Giá vốn",
      email: "Email",
      role_id: "ID Vai trò",
      category_id: "ID Danh mục",
      is_active: "Trạng thái hiển thị",
      count: "Số lượng",
      ids: "Danh sách ID",
      category_name: "Tên danh mục",
      sku: "Mã SKU",
      slug: "Đường dẫn",
      type: "Phân loại",
      brand: "Thương hiệu",
      stock: "Tồn kho",
      origin: "Xuất xứ",
      gallery: "Thư viện ảnh",
      supplier: "Nhà cung cấp",
      image_url: "Ảnh đại diện",
      description: "Mô tả",
      restock_date: "Ngày nhập hàng",
      discount_rate: "Tỷ lệ giảm giá (%)",
      is_bestseller: "Ghim Bán chạy",
      warranty_info: "Bảo hành",
      specifications: "Thông số kỹ thuật",
      meta_title: "Tiêu đề SEO",
      meta_description: "Mô tả SEO",
      changes: "Dữ liệu thay đổi",
      product_name: "Sản phẩm",
      order_id: "Mã đơn hàng",
      customer_name: "Tên khách hàng"
    };
    return map[key] || key;
  };

  const formatDetailValue = (val: any): React.ReactNode => {
    if (val === null || val === undefined || val === "") return <span className="text-gray-400 italic">Không có / Trống</span>;
    if (typeof val === "boolean") return val ? "Có / Bật" : "Không / Tắt";
    
    // Parse JSON string if it looks like one
    let parsedVal = val;
    if (typeof val === "string" && (val.startsWith("{") || val.startsWith("["))) {
      try {
        parsedVal = JSON.parse(val);
      } catch (e) {
        // Not JSON, keep original
      }
    }

    if (Array.isArray(parsedVal)) {
      if (parsedVal.length === 0) return <span className="text-gray-400 italic">Trống</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {parsedVal.map((item, idx) => (
             <span key={idx} className="px-2 py-1 bg-gray-100/80 border border-gray-200 text-gray-700 rounded-md text-[11px] font-medium break-all max-w-full">
               {typeof item === 'object' ? "Đối tượng phức tạp" : String(item)}
             </span>
          ))}
        </div>
      );
    }

    if (typeof parsedVal === "object" && parsedVal !== null) {
      return (
        <div className="space-y-0.5 mt-1 bg-white rounded-lg border border-gray-100 overflow-hidden">
          {Object.entries(parsedVal).map(([k, v], idx) => (
            <div key={k} className={`flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs p-2.5 ${idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} border-b border-gray-50 last:border-0`}>
              <span className="text-gray-500 font-medium sm:w-1/3 shrink-0">{formatDetailKey(k)}:</span>
              <span className="text-gray-900 break-words sm:w-2/3 font-medium">
                {typeof v === 'object' ? formatDetailValue(v) : String(v)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    const strVal = String(parsedVal);
    // Nếu chuỗi dài hoặc chứa mã HTML, bọc trong một box scrollable
    if (strVal.length > 200 || (strVal.includes("<p>") && strVal.includes("</p>"))) {
      return (
         <div className="max-h-40 overflow-y-auto custom-scrollbar p-3 bg-gray-50 rounded-lg text-xs leading-relaxed border border-gray-100 text-gray-700 whitespace-pre-wrap">
           {strVal.replace(/<[^>]*>?/gm, '')} {/* Strip HTML for safe viewing */}
         </div>
      );
    }

    return strVal;
  };

  const formatEntityLabel = (entityType: string) => {
    const map: Record<string, string> = {
      products: "Sản phẩm",
      orders: "Đơn hàng",
      articles: "Bài viết",
      leads: "Lead tư vấn",
      roles: "Phân quyền",
      system: "Hệ thống",
    };
    return map[entityType] || entityType;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2 shrink-0">
        <div className="flex-1">
          <AdminTableToolbar
            title="Nhật ký hoạt động"
            totalCount={count}
            subtitle="Ghi vết và theo dõi thao tác người dùng"
            showFilterToggle={true}
            filterToggleLabel="Bộ lọc"
            isFiltersOpen={showFilters}
            onToggleFilters={() => setShowFilters(prev => !prev)}
            activeFiltersCount={
              (searchParams.get("entity_type") ? 1 : 0) + 
              (searchParams.get("severity") ? 1 : 0)
            }
          />
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hành động, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--primary)] w-64 md:w-72 transition-colors shadow-2xs"
            />
          </div>
          <button type="submit" className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-[var(--primary-light)] transition-colors shadow-2xs cursor-pointer">
            Tìm
          </button>
        </form>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200 mb-2">
          <AdminFilterBar filters={filterConfigs} />
        </div>
      )}

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Thời gian</th>
                <th className="px-3 py-2.5">Người thực hiện</th>
                <th className="px-3 py-2.5">Hành động</th>
                <th className="px-3 py-2.5">Đối tượng</th>
                <th className="px-3 py-2.5 text-center">Mức độ</th>
                <th className="px-3 py-2.5 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Chưa có bản ghi nhật ký hoạt động nào.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="p-4 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    {/* User Email */}
                    <td className="p-4 font-medium text-gray-900 whitespace-nowrap">
                      {log.user_email || "Hệ thống"}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-semibold text-xs text-gray-900">
                        {getLogActionLabel(log.action)}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-[var(--primary)]">
                          {getEntityLabel(log.entity_type)}
                        </span>
                        <span className="text-[11px] text-gray-500 max-w-[200px] truncate" title={log.details?.name || log.details?.title || log.details?.email || (log.entity_id ? `ID: ${log.entity_id}` : "")}>
                          {log.details?.name || log.details?.title || log.details?.email || (log.entity_id ? `ID: ${log.entity_id.slice(0, 8)}...` : "")}
                        </span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>

                    {/* Action Details */}
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-[var(--primary)] transition-colors cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <AdminPagination 
          currentPage={page} 
          totalPages={totalPages} 
          totalItems={count}
          itemsPerPage={pageSize}
          setCurrentPage={(p) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", p.toString());
            router.push(`${pathname}?${params.toString()}`);
          }}
          setItemsPerPage={() => {}}
        />
      </div>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-lg font-bold text-gray-900">Chi tiết thao tác</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm border border-gray-100">
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Hành động:</span>
                  <span className="font-bold text-gray-900">{getLogActionLabel(selectedLog.action)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Thời gian:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedLog.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Người thực hiện:</span>
                  <span className="font-semibold text-[var(--primary)]">{selectedLog.user_email || "Hệ thống"}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Đối tượng tác động:</span>
                  <span className="font-semibold text-gray-900">
                    {getEntityLabel(selectedLog.entity_type)}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[var(--primary)] rounded-full"></span>
                  Thông tin thay đổi
                </h4>
                
                {Object.keys(selectedLog.details || {}).length > 0 ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-sm">
                    {Object.entries(selectedLog.details || {}).map(([key, value], index) => (
                      <div key={key} className={`flex flex-col sm:flex-row border-b border-gray-50 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="sm:w-1/3 p-3 text-gray-500 font-medium border-b sm:border-b-0 sm:border-r border-gray-50">
                          {formatDetailKey(key)}
                        </div>
                        <div className="sm:w-2/3 p-3 text-gray-900 font-medium break-words">
                          {formatDetailValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl text-gray-500 text-sm text-center italic border border-gray-100">
                    Không có thông tin chi tiết cho hành động này.
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors cursor-pointer shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
