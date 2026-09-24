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
  Ban,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  ExternalLink,
  Edit2,
  Send,
  AlertTriangle,
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
// Status UI Config (Chuẩn Vận hành 3PL)
// ==========================================

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán QR", color: "text-amber-700", bgColor: "bg-amber-50", icon: Clock },
  CONFIRMED: { label: "Chờ soát đơn", color: "text-blue-700", bgColor: "bg-blue-50", icon: CheckCircle },
  PROCESSING: { label: "Chờ gửi bưu cục", color: "text-indigo-700", bgColor: "bg-indigo-50", icon: Package },
  SHIPPED: { label: "Đã gửi bên thứ 3", color: "text-purple-700", bgColor: "bg-purple-50", icon: Truck },
  DELIVERED: { label: "Đã giao thành công", color: "text-emerald-700", bgColor: "bg-emerald-50", icon: CheckCircle },
  RETURNED: { label: "Hoàn hàng (Boom)", color: "text-rose-700", bgColor: "bg-rose-50", icon: Ban },
  CANCELLED: { label: "Đã hủy", color: "text-gray-500", bgColor: "bg-gray-100", icon: XCircle },
};

const COMMON_CARRIERS = [
  "Giao Hàng Nhanh (GHN)",
  "Giao Hàng Tiết Kiệm (GHTK)",
  "Viettel Post",
  "J&T Express",
  "VNPost (Bưu Điện)",
  "Khác",
];

export function getTrackingUrl(carrier?: string, trackingNumber?: string): string | null {
  if (!trackingNumber) return null;
  const c = (carrier || "").toLowerCase();
  if (c.includes("ghn") || c.includes("nhanh")) {
    return `https://donhang.ghn.vn/?order_code=${trackingNumber}`;
  }
  if (c.includes("ghtk") || c.includes("tiết kiệm") || c.includes("tiet kiem")) {
    return `https://i.ghtk.vn/${trackingNumber}`;
  }
  if (c.includes("viettel")) {
    return `https://viettelpost.com.vn/tra-cuu-hanh-trinh-don/?order_number=${trackingNumber}`;
  }
  if (c.includes("j&t") || c.includes("jt")) {
    return `https://jtexpress.vn/vi/tracking?billcode=${trackingNumber}`;
  }
  if (c.includes("vnpost") || c.includes("bưu điện")) {
    return `http://www.vnpost.vn/vi-vn/dinh-vi/buu-pham?key=${trackingNumber}`;
  }
  return null;
}

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

  // Modal Gửi Bưu Cục (Handover to 3PL)
  const [shippingModalOrder, setShippingModalOrder] = useState<OrderRecord | null>(null);
  const [shippingCarrier, setShippingCarrier] = useState(COMMON_CARRIERS[0]);
  const [customCarrier, setCustomCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [submittingShipping, setSubmittingShipping] = useState(false);

  // Modal Sửa Người Nhận
  const [editRecipientOrder, setEditRecipientOrder] = useState<OrderRecord | null>(null);
  const [editRecipientForm, setEditRecipientForm] = useState({
    customerName: "",
    customerPhone: "",
    shippingAddress: "",
    note: "",
  });
  const [submittingRecipient, setSubmittingRecipient] = useState(false);

  // Modal Hủy Đơn
  const [cancelModalOrder, setCancelModalOrder] = useState<OrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("Khách yêu cầu hủy đơn");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Modal Xác nhận Đã Giao (DELIVERED)
  const [deliveredModalOrder, setDeliveredModalOrder] = useState<OrderRecord | null>(null);
  const [deliveredNote, setDeliveredNote] = useState("");
  const [submittingDelivered, setSubmittingDelivered] = useState(false);

  // Modal Xác nhận Hoàn Hàng (RETURNED)
  const [returnedModalOrder, setReturnedModalOrder] = useState<OrderRecord | null>(null);
  const [returnedReason, setReturnedReason] = useState("Khách từ chối nhận hàng (Boom hàng)");
  const [customReturnedReason, setCustomReturnedReason] = useState("");
  const [submittingReturned, setSubmittingReturned] = useState(false);

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

  // Status tab (Tabs nghiệp vụ mới)
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

  // Xem chi tiết
  const handleViewDetail = async (order: OrderRecord) => {
    setLoadingDetail(true);
    setSelectedOrder(order);
    const detail = await ordersApi.getAdminOrderDetail(order.id);
    if (detail) setSelectedOrder(detail);
    setLoadingDetail(false);
  };

  // Đổi trạng thái trực tiếp
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
      toast.success(`Đã chuyển sang "${statusConfig[nextStatus]?.label || nextStatus}"`);
      router.refresh();
      if (selectedOrder?.id === orderId) {
        const detail = await ordersApi.getAdminOrderDetail(orderId);
        if (detail) setSelectedOrder(detail);
      }
    } else {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  // Mở modal Gửi bưu cục (Từ PROCESSING -> SHIPPED)
  const handleOpenShippingModal = (order: OrderRecord) => {
    setShippingModalOrder(order);
    setShippingCarrier(order.shipping_carrier || COMMON_CARRIERS[0]);
    setTrackingNumber(order.tracking_number || "");
    setCustomCarrier("");
  };

  // Xác nhận đã gửi bưu cục
  const handleConfirmShipping = async () => {
    if (!shippingModalOrder) return;
    const finalCarrier = shippingCarrier === "Khác" ? customCarrier.trim() : shippingCarrier;
    if (!finalCarrier) {
      toast.error("Vui lòng chọn hoặc nhập Tên hãng vận chuyển.");
      return;
    }
    if (!trackingNumber.trim()) {
      toast.error("Vui lòng nhập Mã vận đơn.");
      return;
    }

    setSubmittingShipping(true);
    try {
      // 1. Cập nhật thông tin vận chuyển
      await ordersApi.updateShipping(shippingModalOrder.id, {
        shippingCarrier: finalCarrier,
        trackingNumber: trackingNumber.trim(),
      });

      // 2. Chuyển sang SHIPPED
      await ordersApi.updateStatus(
        shippingModalOrder.id,
        "SHIPPED",
        `Đã gửi qua ${finalCarrier} - Mã: ${trackingNumber.trim()}`
      );

      toast.success(`Đã cập nhật: Đã gửi qua ${finalCarrier}!`);
      setShippingModalOrder(null);
      router.refresh();
      if (selectedOrder?.id === shippingModalOrder.id) {
        const detail = await ordersApi.getAdminOrderDetail(shippingModalOrder.id);
        if (detail) setSelectedOrder(detail);
      }
    } catch {
      toast.error("Có lỗi xảy ra khi cập nhật thông tin vận chuyển.");
    } finally {
      setSubmittingShipping(false);
    }
  };

  // Mở modal Sửa Người Nhận
  const handleOpenEditRecipient = (order: OrderRecord) => {
    setEditRecipientOrder(order);
    setEditRecipientForm({
      customerName: order.customer_name || "",
      customerPhone: order.customer_phone || "",
      shippingAddress: [order.shipping_address, order.shipping_ward, order.shipping_district, order.shipping_province].filter(Boolean).join(", "),
      note: order.note || "",
    });
  };

  // Lưu thông tin người nhận
  const handleSaveRecipient = async () => {
    if (!editRecipientOrder) return;
    if (!editRecipientForm.customerName.trim() || !editRecipientForm.customerPhone.trim()) {
      toast.error("Tên và Số điện thoại không được để trống.");
      return;
    }

    setSubmittingRecipient(true);
    try {
      const ok = await ordersApi.updateRecipient(editRecipientOrder.id, {
        customerName: editRecipientForm.customerName.trim(),
        customerPhone: editRecipientForm.customerPhone.trim(),
        shippingAddress: editRecipientForm.shippingAddress.trim(),
        note: editRecipientForm.note.trim() || undefined,
      });

      if (ok) {
        toast.success("Đã cập nhật thông tin nhận hàng!");
        setEditRecipientOrder(null);
        router.refresh();
        if (selectedOrder?.id === editRecipientOrder.id) {
          const detail = await ordersApi.getAdminOrderDetail(editRecipientOrder.id);
          if (detail) setSelectedOrder(detail);
        }
      } else {
        toast.error("Không thể cập nhật thông tin.");
      }
    } catch {
      toast.error("Có lỗi xảy ra.");
    } finally {
      setSubmittingRecipient(false);
    }
  };

  // Mở modal Hủy Đơn
  const handleOpenCancelModal = (order: OrderRecord) => {
    setCancelModalOrder(order);
    setCancelReason("Khách yêu cầu hủy đơn");
    setCustomCancelReason("");
  };

  // Xác nhận Hủy đơn
  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const finalReason = cancelReason === "Khác" ? customCancelReason.trim() : cancelReason;
    if (!finalReason) {
      toast.error("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    setSubmittingCancel(true);
    try {
      await handleStatusAction(cancelModalOrder.id, "CANCELLED", finalReason);
      setCancelModalOrder(null);
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Mở modal Đã Giao
  const handleOpenDeliveredModal = (order: OrderRecord) => {
    setDeliveredModalOrder(order);
    setDeliveredNote(
      order.payment_method === "COD"
        ? "Bưu tá đã thu COD thành công"
        : "Khách đã nhận kiện hàng"
    );
  };

  // Xác nhận Đã Giao
  const handleConfirmDelivered = async () => {
    if (!deliveredModalOrder) return;
    setSubmittingDelivered(true);
    try {
      await handleStatusAction(
        deliveredModalOrder.id,
        "DELIVERED",
        deliveredNote.trim() || undefined
      );
      setDeliveredModalOrder(null);
    } finally {
      setSubmittingDelivered(false);
    }
  };

  // Mở modal Hoàn Hàng
  const handleOpenReturnedModal = (order: OrderRecord) => {
    setReturnedModalOrder(order);
    setReturnedReason("Khách từ chối nhận hàng (Boom hàng)");
    setCustomReturnedReason("");
  };

  // Xác nhận Hoàn Hàng
  const handleConfirmReturned = async () => {
    if (!returnedModalOrder) return;
    const finalReason =
      returnedReason === "Khác" ? customReturnedReason.trim() : returnedReason;
    if (!finalReason) {
      toast.error("Vui lòng nhập lý do hoàn hàng.");
      return;
    }
    setSubmittingReturned(true);
    try {
      await handleStatusAction(returnedModalOrder.id, "RETURNED", finalReason);
      setReturnedModalOrder(null);
    } finally {
      setSubmittingReturned(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Toolbar với các Tab Vận hành Chuẩn 3PL */}
      <AdminTableToolbar
        tabs={[
          { key: "all", label: "Tất cả", count: totalCount },
          { key: "CONFIRMED", label: "Chờ soát đơn" },
          { key: "PROCESSING", label: "Chờ gửi bưu cục" },
          { key: "SHIPPED", label: "Đã gửi bên thứ 3" },
          { key: "DELIVERED", label: "Đã giao" },
          { key: "PENDING_PAYMENT", label: "Chờ TT QR" },
          { key: "RETURNED", label: "Hoàn hàng (Boom)" },
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

      {/* Table Danh sách Đơn hàng */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[950px] text-left border-collapse">
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
                <th className="px-3 py-2.5">Khách hàng & Nhận hàng</th>
                <th className="px-3 py-2.5 text-right">Tổng tiền</th>
                <th className="px-3 py-2.5 text-center">Dòng tiền</th>
                <th className="px-3 py-2.5 text-center">Vận hành (3PL)</th>
                <th className="px-3 py-2.5">Bưu cục & Vận đơn</th>
                <th className="px-3 py-2.5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 text-sm">
                    Chưa có đơn hàng nào trong mục này.
                  </td>
                </tr>
              )}
              {orders?.map((order) => {
                const st = statusConfig[order.status] ?? statusConfig.PENDING_PAYMENT;
                const StatusIcon = st.icon;
                const canCancel = CANCELLABLE_STATUSES.includes(order.status as OrderStatus);
                const isCompact = density === "compact";
                const cp = isCompact ? "px-3 py-2" : "px-3 py-3";
                const trackingUrl = getTrackingUrl(order.shipping_carrier, order.tracking_number);

                // Dòng tiền badge
                const isBankTransfer = order.payment_method === "BANK_TRANSFER";
                const isPaid = order.payment_status === "PAID";

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
                      <span className="font-mono text-xs font-semibold text-gray-800">
                        {order.order_code || `#${order.id.slice(0, 8).toUpperCase()}`}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </td>
                    <td className={cp}>
                      <p className="font-semibold text-gray-900 text-xs">{order.customer_name || "—"}</p>
                      <p className="text-[10px] text-gray-500">{order.customer_phone || "—"}</p>
                      <p className="text-[10px] text-gray-400 truncate max-w-[200px]" title={[order.shipping_address, order.shipping_ward, order.shipping_district, order.shipping_province].filter(Boolean).join(", ")}>
                        {[order.shipping_address, order.shipping_district, order.shipping_province].filter(Boolean).join(", ")}
                      </p>
                    </td>
                    <td className={`${cp} text-right font-bold text-gray-900 text-xs tracking-tight`}>
                      {Number(order.total_amount).toLocaleString("vi-VN")}₫
                    </td>
                    {/* Dòng tiền */}
                    <td className={`${cp} text-center`}>
                      {isBankTransfer ? (
                        isPaid ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ĐÃ TT (VietQR)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            CHỜ TT (VietQR)
                          </span>
                        )
                      ) : (
                        isPaid ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ĐÃ THU COD
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800" title="Chờ bưu tá thu hộ và đối soát">
                            THU HỘ COD: {Number(order.total_amount).toLocaleString("vi-VN")}₫
                          </span>
                        )
                      )}
                    </td>
                    {/* Trạng thái Vận hành */}
                    <td className={`${cp} text-center`}>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${st.color} ${st.bgColor}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {st.label}
                      </span>
                    </td>
                    {/* Thông tin Bưu cục */}
                    <td className={`${cp}`}>
                      {order.tracking_number ? (
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-gray-800">{order.shipping_carrier || "Bưu cục"}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-gray-500">{order.tracking_number}</span>
                            {trackingUrl && (
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 p-0.5"
                                title="Mở trang tra cứu bưu cục"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">Chưa có mã vận đơn</span>
                      )}
                    </td>
                    {/* Thao tác Theo Ngữ Cảnh */}
                    <td className={`${cp}`}>
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {/* Bước 1: CONFIRMED (Chờ soát đơn) -> Nút Duyệt đóng gói + Sửa địa chỉ */}
                        {order.status === "CONFIRMED" && (
                          <>
                            <button
                              onClick={() => handleStatusAction(order.id, "PROCESSING")}
                              disabled={updatingStatus === order.id}
                              className="px-2 py-1 rounded-md text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                              title="Chuyển sang Đang đóng gói"
                            >
                              Duyệt đóng gói
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenEditRecipient(order)}
                              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                              title="Sửa SĐT / Địa chỉ người nhận"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Bước 2: PROCESSING (Đang đóng gói) -> Nút Gửi bưu cục */}
                        {order.status === "PROCESSING" && (
                          <>
                            <button
                              onClick={() => handleOpenShippingModal(order)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1"
                              title="Bàn giao bưu tá & Nhập mã vận đơn"
                            >
                              <Send className="w-3 h-3" />
                              Gửi bưu cục
                            </button>
                            <button
                              onClick={() => handleOpenEditRecipient(order)}
                              className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors"
                              title="Sửa SĐT / Địa chỉ trước khi xuất kho"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* Bước 3: SHIPPED (Đã gửi bên thứ 3) -> Nút Đã giao + Báo hoàn hàng */}
                        {order.status === "SHIPPED" && (
                          <>
                            <button
                              onClick={() => handleOpenDeliveredModal(order)}
                              disabled={updatingStatus === order.id}
                              className="px-2 py-1 rounded-md text-[10px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-0.5"
                              title="Xác nhận bưu tá phát thành công & đối soát thu tiền"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Đã giao
                            </button>
                            <button
                              onClick={() => handleOpenReturnedModal(order)}
                              disabled={updatingStatus === order.id}
                              className="px-2 py-1 rounded-md text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-0.5"
                              title="Báo bưu cục chuyển hoàn hàng về kho"
                            >
                              <Ban className="w-3 h-3" />
                              Hoàn hàng
                            </button>
                          </>
                        )}

                        {/* Nút Hủy (khi đơn chưa gửi) */}
                        {canCancel && (
                          <button
                            onClick={() => handleOpenCancelModal(order)}
                            className="px-2 py-1 rounded-md text-[10px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                            title="Hủy đơn"
                          >
                            Hủy
                          </button>
                        )}

                        {/* Nút Xem chi tiết */}
                        <button
                          onClick={() => handleViewDetail(order)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết đơn"
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

      {/* ========================================== */}
      {/* MODAL 1: GỬI BƯU CỤC (HANDOVER TO 3PL) */}
      {/* ========================================== */}
      <Modal
        isOpen={!!shippingModalOrder}
        onClose={() => setShippingModalOrder(null)}
        title="Bàn giao cho Đơn vị vận chuyển (3PL)"
        maxWidth="max-w-lg"
      >
        {shippingModalOrder && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1">
              <p className="flex justify-between">
                <span className="text-gray-500">Mã đơn hàng:</span>
                <span className="font-bold text-gray-800">{shippingModalOrder.order_code}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Khách nhận:</span>
                <span className="font-medium text-gray-800">{shippingModalOrder.customer_name} ({shippingModalOrder.customer_phone})</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Thu hộ COD:</span>
                <span className="font-bold text-orange-600">
                  {shippingModalOrder.payment_method === "COD"
                    ? `${Number(shippingModalOrder.total_amount).toLocaleString("vi-VN")}₫`
                    : "0₫ (Đã thanh toán trước)"}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Đơn vị vận chuyển (Hãng bưu cục) *
              </label>
              <select
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_CARRIERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {shippingCarrier === "Khác" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nhập tên đơn vị vận chuyển *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ahamove, Lalamove, Xe khách..."
                  value={customCarrier}
                  onChange={(e) => setCustomCarrier(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mã vận đơn (Tracking Code) *
              </label>
              <input
                type="text"
                placeholder="Nhập mã trên phiếu gửi hàng (VD: GHN12345678)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 font-mono focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Mã này dùng để tạo link tra cứu bưu cục và kiểm tra hành trình gói hàng.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShippingModalOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmShipping}
                disabled={submittingShipping}
                className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                {submittingShipping ? "Đang lưu..." : "Xác nhận đã gửi"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL 2: SỬA THÔNG TIN NGƯỜI NHẬN */}
      {/* ========================================== */}
      <Modal
        isOpen={!!editRecipientOrder}
        onClose={() => setEditRecipientOrder(null)}
        title="Sửa Thông Tin Người Nhận"
        maxWidth="max-w-lg"
      >
        {editRecipientOrder && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Chỉnh sửa thông tin liên hệ và địa chỉ cho đơn hàng <b>{editRecipientOrder.order_code}</b> trước khi xuất kho.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Họ tên người nhận *</label>
              <input
                type="text"
                value={editRecipientForm.customerName}
                onChange={(e) => setEditRecipientForm((p) => ({ ...p, customerName: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại *</label>
              <input
                type="text"
                value={editRecipientForm.customerPhone}
                onChange={(e) => setEditRecipientForm((p) => ({ ...p, customerPhone: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ giao hàng *</label>
              <textarea
                rows={2}
                value={editRecipientForm.shippingAddress}
                onChange={(e) => setEditRecipientForm((p) => ({ ...p, shippingAddress: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú giao hàng</label>
              <input
                type="text"
                value={editRecipientForm.note}
                onChange={(e) => setEditRecipientForm((p) => ({ ...p, note: e.target.value }))}
                className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditRecipientOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveRecipient}
                disabled={submittingRecipient}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {submittingRecipient ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL 3: HỦY ĐƠN HÀNG KÈM LÝ DO */}
      {/* ========================================== */}
      <Modal
        isOpen={!!cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        title="Hủy Đơn Hàng"
        maxWidth="max-w-md"
      >
        {cancelModalOrder && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-semibold">Hủy đơn {cancelModalOrder.order_code}</p>
                <p className="text-red-600 mt-0.5">Số lượng hàng đã giữ sẽ tự động được hoàn lại kho.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do hủy đơn *</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-red-500"
              >
                <option value="Khách yêu cầu hủy đơn">Khách yêu cầu hủy đơn</option>
                <option value="Số điện thoại sai / Không liên lạc được">Số điện thoại sai / Không liên lạc được</option>
                <option value="Địa chỉ không rõ ràng / Nghi ngờ đơn ảo">Địa chỉ không rõ ràng / Nghi ngờ đơn ảo</option>
                <option value="Hết hàng trong kho">Hết hàng trong kho</option>
                <option value="Quá hạn thanh toán VietQR">Quá hạn thanh toán VietQR</option>
                <option value="Khác">Lý do khác...</option>
              </select>
            </div>

            {cancelReason === "Khác" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nhập lý do cụ thể *</label>
                <textarea
                  rows={2}
                  value={customCancelReason}
                  onChange={(e) => setCustomCancelReason(e.target.value)}
                  placeholder="Ghi rõ lý do hủy..."
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {submittingCancel ? "Đang hủy..." : "Xác nhận Hủy"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL 4: XÁC NHẬN ĐÃ GIAO THÀNH CÔNG (DELIVERED) */}
      {/* ========================================== */}
      <Modal
        isOpen={!!deliveredModalOrder}
        onClose={() => setDeliveredModalOrder(null)}
        title="Xác nhận Đã Giao Thành Công"
        maxWidth="max-w-md"
      >
        {deliveredModalOrder && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-emerald-50 p-3.5 rounded-xl border border-emerald-100">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-1">
                <p className="font-semibold text-emerald-800">
                  Xác nhận giao thành công đơn {deliveredModalOrder.order_code}
                </p>
                <p className="text-emerald-700">
                  Bưu tá của {deliveredModalOrder.shipping_carrier || "đơn vị vận chuyển"} đã phát kiện hàng thành công đến khách hàng.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-medium text-gray-800">
                  {deliveredModalOrder.customer_name} ({deliveredModalOrder.customer_phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mã vận đơn:</span>
                <span className="font-mono font-medium text-gray-800">
                  {deliveredModalOrder.tracking_number || "—"} ({deliveredModalOrder.shipping_carrier || "Bưu cục"})
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="text-gray-600 font-medium">Hình thức & Dòng tiền:</span>
                {deliveredModalOrder.payment_method === "COD" ? (
                  <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded text-[11px]">
                    Thu hộ COD: {Number(deliveredModalOrder.total_amount).toLocaleString("vi-VN")}₫
                  </span>
                ) : (
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    Đã thanh toán trước (VietQR)
                  </span>
                )}
              </div>
            </div>

            {deliveredModalOrder.payment_method === "COD" && (
              <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <b>Lưu ý đối soát COD:</b> Khi bấm xác nhận, hệ thống sẽ tự động chuyển dòng tiền sang <b>ĐÃ THANH TOÁN (PAID)</b>. Hãy đảm bảo bưu tá hoặc đối tác vận chuyển đã thu đủ tiền từ người nhận.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ghi chú đối soát / xác nhận</label>
              <input
                type="text"
                value={deliveredNote}
                onChange={(e) => setDeliveredNote(e.target.value)}
                placeholder="Ví dụ: Bưu tá đã nộp tiền, khách ký nhận lúc 10h..."
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeliveredModalOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmDelivered}
                disabled={submittingDelivered}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {submittingDelivered ? "Đang xử lý..." : "Xác nhận Đã giao"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL 5: XÁC NHẬN HOÀN HÀNG (RETURNED / BOOM) */}
      {/* ========================================== */}
      <Modal
        isOpen={!!returnedModalOrder}
        onClose={() => setReturnedModalOrder(null)}
        title="Xác nhận Hoàn Hàng Về Kho (Boom hàng)"
        maxWidth="max-w-md"
      >
        {returnedModalOrder && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-rose-50 p-3.5 rounded-xl border border-rose-100">
              <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-semibold text-rose-800">
                  Hoàn hàng đơn {returnedModalOrder.order_code}
                </p>
                <p className="text-rose-700">
                  Đơn vị vận chuyển sẽ hoàn trả kiện hàng về kho của bạn.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Tự động hoàn trả tồn kho (Restock)
              </p>
              <p className="text-amber-700">
                Toàn bộ số lượng sản phẩm trong đơn hàng này sẽ được cộng trả lại vào kho sau khi xác nhận hoàn hàng.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lý do hoàn hàng *</label>
              <select
                value={returnedReason}
                onChange={(e) => setReturnedReason(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-rose-500"
              >
                <option value="Khách từ chối nhận hàng (Boom hàng)">Khách từ chối nhận hàng (Boom hàng)</option>
                <option value="Không liên lạc được khách (Bưu tá phát 3 lần thất bại)">Không liên lạc được khách (Phát 3 lần thất bại)</option>
                <option value="Sai số điện thoại / địa chỉ người nhận">Sai số điện thoại / địa chỉ người nhận</option>
                <option value="Khách kiểm tra hàng không đúng ý và trả lại">Khách kiểm tra hàng không đúng ý và trả lại</option>
                <option value="Hàng bị móp méo / vỡ trong lúc vận chuyển">Hàng bị móp méo / vỡ trong lúc vận chuyển</option>
                <option value="Khác">Lý do khác...</option>
              </select>
            </div>

            {returnedReason === "Khác" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nhập lý do cụ thể *</label>
                <textarea
                  rows={2}
                  value={customReturnedReason}
                  onChange={(e) => setCustomReturnedReason(e.target.value)}
                  placeholder="Ghi rõ lý do hoàn kiện..."
                  className="w-full text-sm rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReturnedModalOrder(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleConfirmReturned}
                disabled={submittingReturned}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                {submittingReturned ? "Đang xử lý..." : "Xác nhận Hoàn hàng"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* MODAL 4: CHI TIẾT ĐƠN HÀNG */}
      {/* ========================================== */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Đơn hàng ${selectedOrder?.order_code || ""}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            {/* Header info grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Khách hàng */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Khách hàng</h4>
                  {CANCELLABLE_STATUSES.includes(selectedOrder.status as OrderStatus) && (
                    <button
                      onClick={() => handleOpenEditRecipient(selectedOrder)}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Sửa
                    </button>
                  )}
                </div>
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

              {/* Thông tin đơn */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thông tin đơn & Dòng tiền</h4>
                <div className="text-xs text-gray-600 space-y-1.5">
                  <p className="flex justify-between">
                    <span>Mã đơn:</span> <span className="font-mono font-semibold">{selectedOrder.order_code}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Phương thức:</span> <span>{selectedOrder.payment_method === "BANK_TRANSFER" ? "Chuyển khoản (VietQR)" : "Thu hộ COD"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Trạng thái tiền:</span>
                    <span className={`font-semibold ${selectedOrder.payment_status === "PAID" ? "text-emerald-600" : "text-amber-600"}`}>
                      {selectedOrder.payment_status === "PAID" ? "Đã nhận tiền" : "Chưa nhận tiền"}
                    </span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>Vận hành:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${statusConfig[selectedOrder.status]?.color} ${statusConfig[selectedOrder.status]?.bgColor}`}>
                      {statusConfig[selectedOrder.status]?.label}
                    </span>
                  </p>
                  {selectedOrder.shipping_carrier && (
                    <p className="flex justify-between items-center">
                      <span>Bưu cục:</span>
                      <span className="font-semibold text-gray-800">{selectedOrder.shipping_carrier}</span>
                    </p>
                  )}
                  {selectedOrder.tracking_number && (
                    <p className="flex justify-between items-center">
                      <span>Mã vận đơn:</span>
                      <span className="font-mono font-semibold flex items-center gap-1 text-blue-600">
                        {selectedOrder.tracking_number}
                        {getTrackingUrl(selectedOrder.shipping_carrier, selectedOrder.tracking_number) && (
                          <a
                            href={getTrackingUrl(selectedOrder.shipping_carrier, selectedOrder.tracking_number)!}
                            target="_blank"
                            rel="noreferrer"
                            className="p-0.5 hover:text-blue-800"
                            title="Tra cứu bưu cục"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </span>
                    </p>
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
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chi tiết sản phẩm đóng thùng</h4>
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
            {(selectedOrder.note || selectedOrder.admin_note || selectedOrder.cancel_reason) && (
              <div className="space-y-2">
                {selectedOrder.note && (
                  <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                    <FileText className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-500 font-semibold">Ghi chú từ khách</p>
                      <p className="text-xs text-gray-700">{selectedOrder.note}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.cancel_reason && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                    <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-red-500 font-semibold">Lý do hủy đơn ({selectedOrder.cancelled_by})</p>
                      <p className="text-xs text-gray-700">{selectedOrder.cancel_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timeline lịch sử trạng thái */}
            {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Nhật ký xử lý đơn</h4>
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
                          <span className={`text-[11px] font-semibold ${statusConfig[h.to_status]?.label ? statusConfig[h.to_status].color : 'text-gray-700'}`}>
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

            {/* Action Buttons Trong Modal */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                {selectedOrder.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleStatusAction(selectedOrder.id, "PROCESSING")}
                    disabled={updatingStatus === selectedOrder.id}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                  >
                    Duyệt đóng gói
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {selectedOrder.status === "PROCESSING" && (
                  <button
                    onClick={() => handleOpenShippingModal(selectedOrder)}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    Gửi bưu cục
                  </button>
                )}

                {selectedOrder.status === "SHIPPED" && (
                  <>
                    <button
                      onClick={() => handleOpenDeliveredModal(selectedOrder)}
                      disabled={updatingStatus === selectedOrder.id}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Xác nhận đã giao thành công
                    </button>
                    <button
                      onClick={() => handleOpenReturnedModal(selectedOrder)}
                      disabled={updatingStatus === selectedOrder.id}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                    >
                      <Ban className="w-4 h-4" />
                      Báo hoàn hàng
                    </button>
                  </>
                )}

                {CANCELLABLE_STATUSES.includes(selectedOrder.status as OrderStatus) && (
                  <button
                    onClick={() => handleOpenCancelModal(selectedOrder)}
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
