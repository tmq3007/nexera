"use client";

import { useState } from "react";
import {
  Eye,
  Clock,
  CheckCircle,
  Truck,
  Trash2,
  Package,
  XCircle,
  CreditCard,
  Ban,
  RotateCcw,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import {
  ordersApi,
  OrderRecord,
  OrderStatus,
  STATUS_ACTIONS,
  CANCELLABLE_STATUSES,
  StatusHistoryEntry,
} from "@/lib/api/orders.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { AdminPagination } from "./AdminPagination";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminBulkActionBar } from "./AdminBulkActionBar";
import { AdminTableToolbar } from "./AdminTableToolbar";
import { logActivity } from "@/lib/logger";

// ==========================================
// Status UI Config
// ==========================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "text-amber-700", bgColor: "bg-amber-50", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", color: "text-blue-700", bgColor: "bg-blue-50", icon: CheckCircle },
  PROCESSING: { label: "Đang xử lý", color: "text-indigo-700", bgColor: "bg-indigo-50", icon: Package },
  SHIPPED: { label: "Đang giao", color: "text-purple-700", bgColor: "bg-purple-50", icon: Truck },
  DELIVERED: { label: "Đã giao", color: "text-emerald-700", bgColor: "bg-emerald-50", icon: CheckCircle },
  COMPLETED: { label: "Hoàn tất", color: "text-green-700", bgColor: "bg-green-50", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", color: "text-gray-500", bgColor: "bg-gray-100", icon: XCircle },
  REFUND_REQUESTED: { label: "Yêu cầu hoàn", color: "text-orange-700", bgColor: "bg-orange-50", icon: RotateCcw },
  REFUNDED: { label: "Đã hoàn tiền", color: "text-red-700", bgColor: "bg-red-50", icon: CreditCard },
  RETURNED: { label: "Hoàn hàng", color: "text-rose-700", bgColor: "bg-rose-50", icon: Ban },
};

const paymentMethodLabels: Record<string, string> = {
  BANK_TRANSFER: "Chuyển khoản",
  COD: "COD",
};

const paymentStatusLabels: Record<string, { label: string; color: string }> = {
  UNPAID: { label: "Chưa TT", color: "text-amber-600" },
  PAID: { label: "Đã TT", color: "text-emerald-600" },
  REFUNDED: { label: "Đã hoàn", color: "text-red-600" },
};

export function OrderManager({
  orders,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 20,
}: {
  orders: OrderRecord[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? orders.map((o) => o.id) : []);
  };
  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
  const handleBulkDelete = async () => {
    if (!confirm(`Xóa ${selectedIds.length} đơn hàng?`)) return;
    const ok = await ordersApi.bulkUpdate({ ids: selectedIds, action: "delete" });
    if (ok) {
      toast.success(`Đã xóa ${selectedIds.length} đơn hàng!`);
      setSelectedIds([]);
      router.refresh();
    } else toast.error("Lỗi khi xóa");
  };

  // Status tab
  const currentStatusTab = searchParams.get("status") ?? "all";
  const handleStatusTabChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") params.delete("status");
    else params.set("status", status);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  // Pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
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

  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveDateFilter = Boolean(searchParams.get("date"));

  // ==========================================
  // Xem chi tiết (load thêm history)
  // ==========================================
  const handleViewDetail = async (order: OrderRecord) => {
    setLoadingDetail(true);
    setSelectedOrder(order);
    const detail = await ordersApi.getAdminOrderDetail(order.id);
    if (detail) setSelectedOrder(detail);
    setLoadingDetail(false);
  };

  // ==========================================
  // Đổi trạng thái (nút hành động)
  // ==========================================
  const handleStatusAction = async (orderId: string, nextStatus: OrderStatus, note?: string) => {
    setUpdatingStatus(orderId);
    const ok = await ordersApi.updateStatus(orderId, nextStatus, note);
    setUpdatingStatus(null);
    if (ok) {
      logActivity({
        action: "UPDATE_ORDER_STATUS",
        entity_type: "orders",
        entity_id: orderId,
        details: { new_status: nextStatus },
      });
      toast.success(`Đã chuyển sang "${statusConfig[nextStatus]?.label}"`);
      router.refresh();
      // Nếu đang mở modal, reload detail
      if (selectedOrder?.id === orderId) {
        const detail = await ordersApi.getAdminOrderDetail(orderId);
        if (detail) setSelectedOrder(detail);
      }
    } else {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  // Hủy đơn (admin)
  const handleCancelOrder = async (orderId: string) => {
    const reason = prompt("Lý do hủy đơn:");
    if (reason === null) return;
    await handleStatusAction(orderId, "CANCELLED", reason || "Admin hủy đơn");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Toolbar */}
      <AdminTableToolbar
        tabs={[
          { key: "all", label: "Tất cả", count: totalCount },
          { key: "PENDING_PAYMENT", label: "Chờ TT" },
          { key: "CONFIRMED", label: "Đã xác nhận" },
          { key: "PROCESSING", label: "Đang xử lý" },
          { key: "SHIPPED", label: "Đang giao" },
          { key: "DELIVERED", label: "Đã giao" },
          { key: "COMPLETED", label: "Hoàn tất" },
          { key: "CANCELLED", label: "Đã hủy" },
        ]}
        activeTabKey={currentStatusTab}
        onTabChange={handleStatusTabChange}
        showFilterToggle={true}
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters((p) => !p)}
        activeFiltersCount={hasActiveDateFilter ? 1 : 0}
        density={density}
        onDensityChange={setDensity}
      />

      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar
            filters={[{ key: "date", label: "Ngày đặt hàng", type: "date" }]}
          />
        </div>
      )}

      <AdminBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        actions={[
          { label: "Xóa", icon: Trash2, onClick: handleBulkDelete, variant: "danger" },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="text-center px-2 py-2.5 w-10">
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
                <th className="px-3 py-2.5 text-center">Thanh toán</th>
                <th className="px-3 py-2.5 text-center">Trạng thái</th>
                <th className="px-3 py-2.5">Ngày tạo</th>
                <th className="px-3 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
              {orders?.map((order) => {
                const st = statusConfig[order.status] ?? statusConfig.PENDING_PAYMENT;
                const StatusIcon = st.icon;
                const action = STATUS_ACTIONS[order.status as OrderStatus];
                const canCancel = CANCELLABLE_STATUSES.includes(order.status as OrderStatus);
                const isCompact = density === "compact";
                const cp = isCompact ? "px-3 py-2" : "px-3 py-3";
                const ps = paymentStatusLabels[order.payment_status || "UNPAID"];

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={`text-center ${cp} w-10`}>
                      <input
                        type="checkbox"
                        onChange={() => handleSelectOne(order.id)}
                        checked={selectedIds.includes(order.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
                    <td className={cp}>
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        {order.order_code || `#${order.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </td>
                    <td className={cp}>
                      <p className="font-semibold text-gray-900 text-xs">{order.customer_name || "—"}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.customer_phone || "—"}</p>
                    </td>
                    <td className={`${cp} text-right font-bold text-gray-900 text-xs tracking-tight`}>
                      {Number(order.total_amount).toLocaleString("vi-VN")}₫
                    </td>
                    <td className={`${cp} text-center`}>
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-gray-400">{paymentMethodLabels[order.payment_method] || order.payment_method}</span>
                        <span className={`text-[11px] font-semibold ${ps?.color}`}>{ps?.label}</span>
                      </div>
                    </td>
                    <td className={`${cp} text-center`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${st.color} ${st.bgColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className={`${cp} text-gray-500 text-xs`}>
                      {new Date(order.created_at).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                      })}
                    </td>
                    <td className={`${cp}`}>
                      <div className="flex items-center justify-center gap-1">
                        {/* Nút hành động chính */}
                        {action && (
                          <button
                            onClick={() => handleStatusAction(order.id, action.nextStatus)}
                            disabled={updatingStatus === order.id}
                            className={`px-2 py-1 rounded-md text-[10px] font-semibold text-white transition-colors ${action.color} disabled:opacity-50 flex items-center gap-0.5`}
                            title={action.label}
                          >
                            {action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {/* Nút hủy */}
                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={updatingStatus === order.id}
                            className="px-2 py-1 rounded-md text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="Hủy đơn"
                          >
                            Hủy
                          </button>
                        )}
                        {/* Nút xem chi tiết */}
                        <button
                          onClick={() => handleViewDetail(order)}
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

        <AdminPagination
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={handleLimitChange}
          totalItems={totalCount}
          totalPages={totalPages}
        />
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Đơn hàng ${selectedOrder?.order_code || ""}`} maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-5">
            {/* Header info grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Khách hàng */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Khách hàng</h4>
                <p className="font-semibold text-gray-800 text-sm">{selectedOrder.customer_name}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  {selectedOrder.customer_phone && (
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {selectedOrder.customer_phone}</p>
                  )}
                  {selectedOrder.customer_email && (
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {selectedOrder.customer_email}</p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{[selectedOrder.shipping_address, selectedOrder.shipping_ward, selectedOrder.shipping_district, selectedOrder.shipping_province].filter(Boolean).join(", ")}</span>
                  </p>
                </div>
              </div>

              {/* Đơn hàng */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thông tin đơn</h4>
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p className="flex justify-between"><span>Mã đơn:</span> <span className="font-mono font-semibold">{selectedOrder.order_code}</span></p>
                  <p className="flex justify-between"><span>Ngày đặt:</span> <span>{new Date(selectedOrder.created_at).toLocaleString("vi-VN")}</span></p>
                  <p className="flex justify-between"><span>Thanh toán:</span> <span>{paymentMethodLabels[selectedOrder.payment_method]}</span></p>
                  <p className="flex justify-between"><span>TT thanh toán:</span>
                    <span className={`font-semibold ${paymentStatusLabels[selectedOrder.payment_status || "UNPAID"]?.color}`}>
                      {paymentStatusLabels[selectedOrder.payment_status || "UNPAID"]?.label}
                    </span>
                  </p>
                  <p className="flex justify-between items-center"><span>Trạng thái:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusConfig[selectedOrder.status]?.color} ${statusConfig[selectedOrder.status]?.bgColor}`}>
                      {statusConfig[selectedOrder.status]?.label}
                    </span>
                  </p>
                  {selectedOrder.tracking_number && (
                    <p className="flex justify-between"><span>Mã vận đơn:</span> <span className="font-mono font-semibold">{selectedOrder.tracking_number}</span></p>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-200 mt-2">
                  <p className="flex justify-between font-bold text-sm text-gray-800">
                    <span>Tổng tiền:</span>
                    <span className="text-[var(--primary)]">{Number(selectedOrder.total_amount).toLocaleString("vi-VN")}₫</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Sản phẩm */}
            {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sản phẩm</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2.5">
                      {(item.product_image || item.products?.image_url) && (
                        <img
                          src={item.product_image || item.products?.image_url}
                          alt={item.product_name || item.products?.name}
                          className="w-10 h-10 object-cover rounded-md border border-gray-200"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.product_name || item.products?.name}</p>
                        {item.product_sku && <p className="text-[10px] text-gray-400">SKU: {item.product_sku}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                        <p className="text-xs font-bold text-gray-800">{Number(item.total_price).toLocaleString("vi-VN")}₫</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ghi chú */}
            {(selectedOrder.note || selectedOrder.admin_note) && (
              <div className="space-y-2">
                {selectedOrder.note && (
                  <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                    <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-500 font-semibold">Ghi chú khách hàng</p>
                      <p className="text-xs text-gray-700">{selectedOrder.note}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.cancel_reason && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-red-500 font-semibold">Lý do hủy ({selectedOrder.cancelled_by})</p>
                      <p className="text-xs text-gray-700">{selectedOrder.cancel_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline lịch sử trạng thái */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Lịch sử trạng thái</h4>
                <div className="space-y-0 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
                  {selectedOrder.statusHistory.map((h: StatusHistoryEntry, idx: number) => (
                    <div key={h.id || idx} className="flex items-start gap-3 relative pb-3">
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 z-10 ${
                        idx === (selectedOrder.statusHistory?.length ?? 0) - 1
                          ? 'bg-[var(--primary)] border-[var(--primary)]'
                          : 'bg-white border-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {h.from_status && (
                            <>
                              <span className="text-[10px] text-gray-400">{statusConfig[h.from_status]?.label || h.from_status}</span>
                              <ArrowRight className="w-3 h-3 text-gray-300" />
                            </>
                          )}
                          <span className={`text-[11px] font-semibold ${statusConfig[h.to_status]?.color || 'text-gray-700'}`}>
                            {statusConfig[h.to_status]?.label || h.to_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400">
                            {new Date(h.created_at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[10px] text-gray-400">• {h.changed_by}</span>
                        </div>
                        {h.note && <p className="text-[10px] text-gray-500 mt-0.5 italic">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {STATUS_ACTIONS[selectedOrder.status as OrderStatus] && (
                  <button
                    onClick={() => handleStatusAction(
                      selectedOrder.id,
                      STATUS_ACTIONS[selectedOrder.status as OrderStatus]!.nextStatus,
                    )}
                    disabled={updatingStatus === selectedOrder.id}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${STATUS_ACTIONS[selectedOrder.status as OrderStatus]!.color} disabled:opacity-50 flex items-center gap-1.5`}
                  >
                    {STATUS_ACTIONS[selectedOrder.status as OrderStatus]!.label}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {CANCELLABLE_STATUSES.includes(selectedOrder.status as OrderStatus) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
