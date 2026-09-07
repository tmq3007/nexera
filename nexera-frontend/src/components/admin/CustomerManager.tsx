"use client";

import { useState } from "react";
import { Users, Mail, Phone, MapPin, Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPagination } from "./AdminPagination";

import { AdminTableToolbar } from "./AdminTableToolbar";

export function CustomerManager({ 
  customers,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  customers: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

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

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header Toolbar */}
      <AdminTableToolbar
        title="Khách hàng"
        totalCount={totalCount}
        subtitle="Danh sách khách hàng đã mua hàng"
        density={density}
        onDensityChange={setDensity}
      />

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Khách hàng</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Số điện thoại</th>
                <th className="px-3 py-2.5 text-center">Đơn hàng</th>
                <th className="px-3 py-2.5 text-center w-16">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400 text-sm">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có khách hàng nào.</p>
                  </td>
                </tr>
              )}
              {customers?.map((customer) => {
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0">
                          {customer.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <span className="font-semibold text-gray-900 text-xs md:text-sm">{customer.full_name}</span>
                      </div>
                    </td>
                    <td className={`${cellPadding} text-xs text-gray-600`}>
                      {customer.email ? (
                        <span>{customer.email}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={`${cellPadding} text-xs text-gray-600`}>
                      {customer.phone ? (
                        <span className="font-mono">{customer.phone}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      <span className="text-xs font-medium text-gray-700">
                        {Array.isArray(customer.orders) ? customer.orders.length : 0} đơn
                      </span>
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
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
    </div>
  );
}
