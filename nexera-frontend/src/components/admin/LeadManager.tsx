"use client";

import { useState } from "react";
import { MessageSquare, Phone, Mail, Clock, Eye, Trash2, Edit } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPagination } from "./AdminPagination";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminBulkActionBar } from "./AdminBulkActionBar";
import { AdminTableToolbar } from "./AdminTableToolbar";
import { useToast } from "@/contexts/ToastContext";
import { logActivity } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/messages";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Mới", color: "text-blue-600" },
  CONTACTED: { label: "Đã liên hệ", color: "text-amber-600" },
  RESOLVED: { label: "Đã xử lý", color: "text-emerald-600" },
};

export function LeadManager({ 
  leads,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  leads: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const toast = useToast();
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(leads.map(l => l.id));
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
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} yêu cầu tư vấn đã chọn?`)) return;
    setIsDeleting(true);
    const { error } = await supabase.from("leads").delete().in("id", selectedIds);
    setIsDeleting(false);
    if (!error) {
      logActivity({
        action: "DELETE_LEADS_BULK",
        entity_type: "leads",
        details: { count: selectedIds.length, ids: selectedIds },
        severity: "WARNING",
      });
      toast.success(`Đã xóa ${selectedIds.length} yêu cầu!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error(formatErrorMessage(error, "Lỗi khi xóa yêu cầu"));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus }).in("id", selectedIds);
    if (!error) {
      logActivity({
        action: "UPDATE_LEADS_STATUS_BULK",
        entity_type: "leads",
        details: { new_status: newStatus, count: selectedIds.length, ids: selectedIds },
      });
      toast.success(`Đã cập nhật trạng thái cho ${selectedIds.length} yêu cầu!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error(formatErrorMessage(error, "Lỗi khi cập nhật trạng thái yêu cầu"));
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

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) {
      alert("Lỗi cập nhật: " + error.message);
    } else {
      logActivity({
        action: "UPDATE_LEAD_STATUS",
        entity_type: "leads",
        entity_id: leadId,
        details: { new_status: newStatus },
      });
      router.refresh();
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status: newStatus });
      }
    }
  };

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

  const hasActiveServiceFilter = Boolean(searchParams.get("service"));

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Top Controls Bar: Reusable AdminTableToolbar */}
      <AdminTableToolbar
        tabs={[
          { key: "all", label: "Tất cả", count: totalCount },
          { key: "NEW", label: "Mới" },
          { key: "CONTACTED", label: "Đã liên hệ" },
          { key: "RESOLVED", label: "Đã xử lý" },
        ]}
        activeTabKey={currentStatusTab}
        onTabChange={handleStatusTabChange}
        showFilterToggle={true}
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        activeFiltersCount={hasActiveServiceFilter ? 1 : 0}
      />

      {/* Service Filter (collapsible) */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar 
            filters={[
              {
                key: "service",
                label: "Mọi dịch vụ",
                type: "select",
                options: [
                  { label: "Điện mặt trời", value: "solar" },
                  { label: "Smart Home", value: "smart_home" }
                ]
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
            label: "Mới",
            icon: Clock,
            onClick: () => handleBulkStatusUpdate("NEW"),
            variant: "default"
          },
          {
            label: "Đã liên hệ",
            icon: Phone,
            onClick: () => handleBulkStatusUpdate("CONTACTED"),
            variant: "primary"
          },
          {
            label: "Đã xử lý",
            icon: Edit,
            onClick: () => handleBulkStatusUpdate("RESOLVED"),
            variant: "primary"
          }
        ]}
      />

      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        {leads && leads.length > 0 && (
          <div className="px-4 py-2.5 border-b border-gray-200/80 flex items-center gap-2 bg-gray-50/80 text-xs text-gray-600">
            <input 
              type="checkbox" 
              onChange={handleSelectAll}
              checked={selectedIds.length === leads.length}
              className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
            />
            <span className="font-semibold text-gray-700">Chọn tất cả ({leads.length})</span>
          </div>
        )}
        <div className="flex-1 overflow-auto p-3 space-y-2.5">
          {(!leads || leads.length === 0) && (
            <div className="py-16 text-center text-gray-400 text-sm">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>Chưa có yêu cầu tư vấn nào phù hợp bộ lọc.</p>
            </div>
          )}

          {leads?.map((lead) => {
            const status = statusConfig[lead.status] ?? statusConfig.NEW;
            return (
              <div key={lead.id} className="bg-white hover:bg-slate-50/70 rounded-xl border border-gray-200/80 p-3.5 hover:shadow-2xs transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="checkbox" 
                      onChange={() => handleSelectOne(lead.id)}
                      checked={selectedIds.includes(lead.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] shrink-0 cursor-pointer"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm inline-block mr-2">{lead.name}</h3>
                      {lead.service && (
                        <span className="text-xs text-gray-500 font-normal">
                          • {lead.service === "solar" ? "Điện mặt trời" : lead.service === "smart_home" ? "Smart Home" : lead.service}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className={`text-xs font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:border-[var(--primary)] bg-gray-50/80 font-medium cursor-pointer"
                    >
                      <option value="NEW">Mới</option>
                      <option value="CONTACTED">Đã liên hệ</option>
                      <option value="RESOLVED">Đã xử lý</option>
                    </select>
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {lead.message && (
                  <div className="mt-2 p-3 bg-white border border-gray-100 rounded-lg text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {lead.message}
                  </div>
                )}
              </div>
            );
          })}
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

      <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Chi tiết yêu cầu tư vấn">
        {selectedLead && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-lg">{selectedLead.name}</h3>
                <span className={`text-xs font-semibold ${statusConfig[selectedLead.status]?.color || statusConfig.NEW.color}`}>
                  {statusConfig[selectedLead.status]?.label || statusConfig.NEW.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" /> {selectedLead.phone || "—"}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" /> {selectedLead.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <Clock className="w-4 h-4 text-gray-400" /> {new Date(selectedLead.created_at).toLocaleString("vi-VN")}
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
    </div>
  );
}
