"use client";

import { useState } from "react";
import { Eye, Clock, CheckCircle, Truck, MapPin, Phone, Mail } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  PAID: { label: "Đã thanh toán", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  SHIPPED: { label: "Đang vận chuyển", color: "bg-purple-100 text-purple-700", icon: Truck },
  COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
};

export function OrderManager({ orders }: { orders: any[] }) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đơn hàng</h1>
        <p className="text-gray-500 text-sm mt-1">Theo dõi và quản lý trạng thái đơn hàng</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Mã đơn</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Khách hàng</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">Tổng tiền</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Trạng thái</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Ngày tạo</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Chưa có đơn hàng nào.
                  </td>
                </tr>
              )}
              {orders?.map((order) => {
                const status = statusConfig[order.status] ?? statusConfig.PENDING;
                const StatusIcon = status.icon;
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">{(order.customers as any)?.full_name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{(order.customers as any)?.phone ?? ""}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-800">{Number(order.total_amount).toLocaleString("vi-VN")} ₫</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(order.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Chi tiết đơn hàng" maxWidth="max-w-3xl">
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thông tin khách hàng</h3>
                <p className="font-medium text-gray-800">{(selectedOrder.customers as any)?.full_name}</p>
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400"/> {(selectedOrder.customers as any)?.phone}</p>
                  {(selectedOrder.customers as any)?.email && (
                     <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400"/> {(selectedOrder.customers as any)?.email}</p>
                  )}
                  <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"/> {selectedOrder.shipping_address || (selectedOrder.customers as any)?.address}</p>
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
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusConfig[selectedOrder.status]?.color}`}>
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
    </>
  );
}
