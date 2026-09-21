"use client";

import { useState } from "react";
import { Eye, Clock, CheckCircle, Truck, Trash2, Edit } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ordersApi } from "@/lib/api/orders.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { AdminPagination } from "./AdminPagination";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminBulkActionBar } from "./AdminBulkActionBar";
import { AdminTableToolbar } from "./AdminTableToolbar";
import { logActivity } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/messages";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Chờ xử lý", color: "text-amber-600", icon: Clock },
  PAID: { label: "Đã thanh toán", color: "text-blue-600", icon: CheckCircle },
  SHIPPED: { label: "Đang vận chuyển", color: "text-purple-600", icon: Truck },
  COMPLETED: { label: "Hoàn thành", color: "text-emerald-600", icon: CheckCircle },
};

export function OrderManager({ 
  orders,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  orders: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} đơn hàng đã chọn?`)) return;
    setIsDeleting(true);
    const success = await ordersApi.bulkUpdate({ ids: selectedIds, action: "delete" });
    setIsDeleting(false);
    if (success) {
      logActivity({
        action: "DELETE_ORDERS_BULK",
        entity_type: "orders",
        details: { count: selectedIds.length, ids: selectedIds },
        severity: "WARNING",
      });
      toast.success(`Đã xóa ${selectedIds.length} đơn hàng!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error("Lỗi khi xóa đơn hàng");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const success = await ordersApi.bulkUpdate({ ids: selectedIds, status: newStatus });
    if (success) {
      logActivity({
        action: "UPDATE_ORDERS_STATUS_BULK",
        entity_type: "orders",
        details: { new_status: newStatus, count: selectedIds.length, ids: selectedIds },
      });
      toast.success(`Đã cập nhật trạng thái cho ${selectedIds.length} đơn hàng!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error("Lỗi khi cập nhật trạng thái đơn hàng");
    }
  };

  // Helper for URL pagination
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleLimitChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [showFilters, setShowFilters] = useState(false);

  const currentStatusTab = searchParams.get("status") ?? "all";

  const handleStatusTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveDateFilter = Boolean(searchParams.get("date"));

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Top Controls Bar: Reusable AdminTableToolbar */}
      <AdminTableToolbar
        tabs={[
          { key: "all", label: "Tất cả", count: totalCount },
          { key: "PENDING", label: "Chờ xử lý" },
          { key: "PAID", label: "Đã thanh toán" },
          { key: "SHIPPED", label: "Đang giao" },
          { key: "COMPLETED", label: "Hoàn thành" },
        ]}
        activeTabKey={currentStatusTab}
        onTabChange={handleStatusTabChange}
        showFilterToggle={true}
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        activeFiltersCount={hasActiveDateFilter ? 1 : 0}
        density={density}
        onDensityChange={setDensity}
      />

      {/* Date Filter (collapsible) */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar 
            filters={[
              {
                key: "date",
                label: "Ngày đặt hàng",
                type: "date"
              }
            ]}
          />
        </div>
      )}

      <AdminBulkActionBar 
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        actions={[
          {
            label: "Xóa",
            icon: Trash2,
            onClick: handleBulkDelete,
            variant: "danger"
          },
          {
            label: "Chờ xử lý",
            icon: Clock,
            onClick: () => handleBulkStatusUpdate("PENDING"),
            variant: "default"
          },
          {
            label: "Đã thanh toán",
            icon: CheckCircle,
            onClick: () => handleBulkStatusUpdate("PAID"),
            variant: "primary"
          },
          {
            label: "Đang giao",
            icon: Truck,
            onClick: () => handleBulkStatusUpdate("SHIPPED"),
            variant: "primary"
          },
          {
            label: "Hoàn thành",
            icon: CheckCircle,
            onClick: () => handleBulkStatusUpdate("COMPLETED"),
            variant: "primary"
          }
        ]}
      />

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="text-center px-3 py-2.5 w-10">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5">Mã đơn</th>
                <th className="px-3 py-2.5">Khách hàng</th>
                <th className="px-3 py-2.5 text-right">Tổng tiền</th>
                <th className="px-3 py-2.5 text-center">Trạng thái</th>
                <th className="px-3 py-2.5">Ngày tạo</th>
                <th className="px-3 py-2.5 text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    Chưa có đơn hàng nào phù hợp bộ lọc.
                  </td>
                </tr>
              )}
              {orders?.map((order) => {
                const status = statusConfig[order.status] ?? statusConfig.PENDING;
                const StatusIcon = status.icon;
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={`text-center ${cellPadding} w-10`}>
                      <input 
                        type="checkbox" 
                        onChange={() => handleSelectOne(order.id)}
                        checked={selectedIds.includes(order.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
                    <td className={cellPadding}>
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className={cellPadding}>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs md:text-sm">{(order.customers as any)?.full_name ?? "Khách vãng lai"}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{(order.customers as any)?.phone ?? "—"}</p>
                      </div>
                    </td>
                    <td className={`${cellPadding} text-right font-bold text-gray-900 text-xs md:text-sm tracking-tight`}>
                      {Number(order.total_amount).toLocaleString("vi-VN")} ₫
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      <span className={`text-xs font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className={`${cellPadding} text-gray-500 text-xs`}>
                      {new Date(order.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <AdminPagination 
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={handleLimitChange}
          totalItems={totalCount}
          totalPages={totalPages}
        />
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Chi tiết đơn hàng" maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thông tin khách hàng</h3>
                <p className="font-medium text-gray-800">{(selectedOrder.customers as any)?.full_name}</p>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p><span className="text-gray-400 text-xs mr-1.5">SĐT:</span> {(selectedOrder.customers as any)?.phone || "—"}</p>
                  {(selectedOrder.customers as any)?.email && (
                     <p><span className="text-gray-400 text-xs mr-1.5">Email:</span> {(selectedOrder.customers as any)?.email}</p>
                  )}
                  <p><span className="text-gray-400 text-xs mr-1.5">Địa chỉ:</span> {selectedOrder.shipping_address || (selectedOrder.customers as any)?.address || "—"}</p>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thông tin đơn hàng</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="flex items-center justify-between">
                    <span>Mã đơn:</span>
                    <span className="font-mono">{selectedOrder.id}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Ngày đặt:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Trạng thái:</span>
                    <span className={`text-xs font-semibold ${statusConfig[selectedOrder.status]?.color}`}>
                      {statusConfig[selectedOrder.status]?.label}
                    </span>
                  </p>
                  <p className="flex items-center justify-between font-bold text-gray-800 text-base mt-2 pt-2 border-t border-gray-200">
                    <span>Tổng tiền:</span>
                    <span className="text-[var(--primary)]">{Number(selectedOrder.total_amount).toLocaleString("vi-VN")} ₫</span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Ghi chú của khách hàng</h3>
              <p className="text-sm text-gray-600 bg-white border border-gray-100 p-4 rounded-lg italic">
                {selectedOrder.note || "Không có ghi chú."}
              </p>
            </div>
            
            <div className="flex justify-end pt-4">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
