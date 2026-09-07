"use client";

import { useState } from "react";
import { Activity, Eye, Search, X } from "lucide-react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminFilterBar, FilterConfig } from "@/components/admin/AdminFilterBar";
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
        return <span className="text-xs font-bold text-purple-700">CRITICAL</span>;
      case "ERROR":
        return <span className="text-xs font-bold text-rose-600">ERROR</span>;
      case "WARNING":
        return <span className="text-xs font-bold text-amber-600">WARNING</span>;
      default:
        return <span className="text-xs font-semibold text-blue-600">INFO</span>;
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#13426E]/10 rounded-xl flex items-center justify-center text-[#13426E]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhật ký Hoạt động (Activity Logs)</h1>
            <p className="text-sm text-gray-500">Ghi vết và theo dõi tất cả thao tác của người dùng & hệ thống Nexera</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hành động, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#13426E] w-64 md:w-80 transition-colors"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#13426E] text-white text-sm font-semibold rounded-xl hover:bg-[#1a5b99] transition-colors">
            Tìm
          </button>
        </form>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar filters={filterConfigs} />

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="p-4">Thời gian</th>
                <th className="p-4">Người thực hiện</th>
                <th className="p-4">Hành động</th>
                <th className="p-4">Đối tượng</th>
                <th className="p-4 text-center">Mức độ</th>
                <th className="p-4 text-right">Chi tiết</th>
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
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs text-gray-800">
                          {getLogActionLabel(log.action)}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Entity */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#13426E]">
                          {getEntityLabel(log.entity_type)}
                        </span>
                        {log.entity_id && (
                          <span className="text-[11px] font-mono text-gray-400 truncate max-w-[150px]">
                            ID: {log.entity_id}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="p-4 text-center whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>

                    {/* Action Details */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-[#13426E] hover:text-white rounded-lg transition-colors text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100">
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
      </div>

      {/* JSON Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#13426E]" />
                <h3 className="text-lg font-bold text-gray-900">Chi tiết Nhật ký #{selectedLog.id.slice(0, 8)}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Hành động:</span>
                  <span className="font-mono font-bold text-gray-800">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Thời gian:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedLog.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Người thực hiện:</span>
                  <span className="font-semibold text-gray-800">{selectedLog.user_email}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Đối tượng tác động:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ""}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">Dữ liệu chi tiết (JSON Payload):</h4>
                <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto font-mono leading-relaxed border border-gray-800">
                  {JSON.stringify(selectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#13426E] text-white rounded-xl text-sm font-semibold hover:bg-[#1a5b99] transition-colors"
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
