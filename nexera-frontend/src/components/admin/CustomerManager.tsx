"use client";

import { useState } from "react";
import { Users, Mail, Phone, MapPin, Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function CustomerManager({ customers }: { customers: any[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khách hàng</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý hồ sơ khách hàng đã mua hàng</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Họ tên</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Email</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Số điện thoại</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Số đơn hàng</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có khách hàng nào.</p>
                  </td>
                </tr>
              )}
              {customers?.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-sm">
                        {customer.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <span className="font-medium text-gray-800">{customer.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {customer.email ? (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {customer.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.phone}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {Array.isArray(customer.orders) ? customer.orders.length : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Hồ sơ khách hàng">
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
               <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-xl">
                  {selectedCustomer.full_name?.charAt(0)?.toUpperCase() ?? "?"}
               </div>
               <div>
                 <h2 className="text-lg font-bold text-gray-800">{selectedCustomer.full_name}</h2>
                 <p className="text-sm text-gray-500">Thành viên từ {new Date(selectedCustomer.created_at).toLocaleDateString("vi-VN")}</p>
               </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">Thông tin liên hệ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Phone className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Số điện thoại</p>
                    <p className="text-sm font-medium text-gray-800">{selectedCustomer.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Mail className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-800">{selectedCustomer.email || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 flex-shrink-0"><MapPin className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-gray-500">Địa chỉ giao hàng mặc định</p>
                  <p className="text-sm font-medium text-gray-800">{selectedCustomer.address || "Chưa cập nhật địa chỉ"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setSelectedCustomer(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
