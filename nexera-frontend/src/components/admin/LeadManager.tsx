"use client";

import { useState } from "react";
import { MessageSquare, Phone, Mail, Clock, Eye, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Mới", color: "bg-blue-100 text-blue-700" },
  CONTACTED: { label: "Đã liên hệ", color: "bg-yellow-100 text-yellow-700" },
  RESOLVED: { label: "Đã xử lý", color: "bg-green-100 text-green-700" },
};

export function LeadManager({ leads }: { leads: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      alert("Lỗi cập nhật: " + error.message);
    } else {
      router.refresh();
      if (selectedLead && selectedLead.id === leadId) {
         setSelectedLead({ ...selectedLead, status: newStatus });
      }
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Yêu cầu tư vấn</h1>
        <p className="text-gray-500 text-sm mt-1">Quản lý các yêu cầu tư vấn từ khách hàng tiềm năng</p>
      </div>

      {(!leads || leads.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Chưa có yêu cầu tư vấn nào.</p>
        </div>
      )}

      <div className="space-y-4">
        {leads?.map((lead) => {
          const status = statusConfig[lead.status] ?? statusConfig.NEW;
          return (
            <div key={lead.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{lead.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {lead.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{lead.email}</span>
                    )}
                    {lead.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lead.phone}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(lead.created_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <select
                     value={lead.status}
                     onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                     className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] bg-white"
                  >
                     <option value="NEW">Mới</option>
                     <option value="CONTACTED">Đã liên hệ</option>
                     <option value="RESOLVED">Đã xử lý</option>
                  </select>
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex border border-transparent hover:border-blue-100"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {lead.message && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {lead.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Chi tiết yêu cầu tư vấn">
        {selectedLead && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-lg">{selectedLead.name}</h3>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedLead.status]?.color || statusConfig.NEW.color}`}>
                   {statusConfig[selectedLead.status]?.label || statusConfig.NEW.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                 <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400"/> {selectedLead.phone || "—"}
                 </div>
                 <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400"/> {selectedLead.email || "—"}
                 </div>
                 <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Clock className="w-4 h-4 text-gray-400"/> {new Date(selectedLead.created_at).toLocaleString("vi-VN")}
                 </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Nội dung tin nhắn:</h3>
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-gray-700 text-sm whitespace-pre-wrap min-h-[100px]">
                 {selectedLead.message || <span className="text-gray-400 italic">Không có nội dung.</span>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
               <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Cập nhật trạng thái:</span>
                  <select
                     value={selectedLead.status}
                     onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                     className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] bg-white"
                  >
                     <option value="NEW">Mới</option>
                     <option value="CONTACTED">Đã liên hệ</option>
                     <option value="RESOLVED">Đã xử lý</option>
                  </select>
               </div>
               <button onClick={() => setSelectedLead(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors">
                 Đóng
               </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
