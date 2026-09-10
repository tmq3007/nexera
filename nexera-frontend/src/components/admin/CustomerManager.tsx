"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AdminPagination } from "./AdminPagination";
import { AdminTableToolbar, StatusTabItem } from "./AdminTableToolbar";
import { createClient } from "@/utils/supabase/client";

interface Customer {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  phone_numbers?: string[] | null;
  emails?: string[] | null;
  address?: string | null;
  avatar_url?: string | null;
  tier?: "VIP" | "LOYAL" | "POTENTIAL" | "STANDARD" | string;
  notes?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string;
  orders?: {
    id: string;
    total_amount?: number;
    status?: string;
    created_at: string;
  }[];
  customer_notes?: {
    id: string;
    content: string;
    created_at: string;
    admin_id?: string | null;
  }[];
  conversations?: {
    id: string;
    status: string;
    last_message_preview?: string | null;
    last_message_at?: string | null;
  }[];
}

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  VIP: { label: "Khách VIP", color: "text-purple-700 font-bold" },
  LOYAL: { label: "Thân thiết", color: "text-emerald-700 font-semibold" },
  POTENTIAL: { label: "Tiềm năng", color: "text-blue-700 font-semibold" },
  STANDARD: { label: "Tiêu chuẩn", color: "text-gray-600 font-medium" },
};

export function CustomerManager({ 
  customers = [],
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  customers: Customer[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"info" | "orders" | "chat" | "notes">("info");
  const [density, setDensity] = useState<"compact" | "normal">("compact");

  // CRM Note state inside modal
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingTier, setEditingTier] = useState<string>("");
  const [isUpdatingTier, setIsUpdatingTier] = useState(false);

  // Pagination Handlers
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

  // Tab Filtering (Tier)
  const currentTier = searchParams.get("tier") || "all";
  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams);
    if (key === "all") {
      params.delete("tier");
    } else {
      params.set("tier", key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const tabs: StatusTabItem[] = [
    { key: "all", label: "Tất cả khách hàng" },
    { key: "VIP", label: "Khách VIP", dotColor: "bg-purple-500" },
    { key: "LOYAL", label: "Thân thiết", dotColor: "bg-emerald-500" },
    { key: "POTENTIAL", label: "Tiềm năng", dotColor: "bg-blue-500" },
    { key: "STANDARD", label: "Tiêu chuẩn", dotColor: "bg-gray-400" },
  ];

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Open modal handler
  const handleOpenCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditingTier(customer.tier || "STANDARD");
    setActiveModalTab("info");
    setNewNote("");
  };

  // Update Tier Handler
  const handleUpdateTier = async (newTier: string) => {
    if (!selectedCustomer) return;
    setIsUpdatingTier(true);
    setEditingTier(newTier);

    const { error } = await supabase
      .from("customers")
      .update({ tier: newTier })
      .eq("id", selectedCustomer.id);

    if (!error) {
      setSelectedCustomer((prev) => (prev ? { ...prev, tier: newTier } : null));
      router.refresh();
    }
    setIsUpdatingTier(false);
  };

  // Add CRM Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomer) return;

    setIsAddingNote(true);

    const { data, error } = await supabase
      .from("customer_notes")
      .insert({
        customer_id: selectedCustomer.id,
        content: newNote.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setSelectedCustomer((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          customer_notes: [data, ...(prev.customer_notes || [])],
        };
      });
      setNewNote("");
    }
    setIsAddingNote(false);
  };

  // State cho thêm số điện thoại & email mới
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [newEmailInput, setNewEmailInput] = useState("");
  const [isUpdatingContact, setIsUpdatingContact] = useState(false);

  // Đặt số điện thoại làm số chính
  const handleSetPrimaryPhone = async (phone: string) => {
    if (!selectedCustomer) return;
    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({ phone })
      .eq("id", selectedCustomer.id);
    if (!error) {
      setSelectedCustomer((prev) => (prev ? { ...prev, phone } : null));
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  // Đặt email làm email chính
  const handleSetPrimaryEmail = async (email: string) => {
    if (!selectedCustomer) return;
    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({ email })
      .eq("id", selectedCustomer.id);
    if (!error) {
      setSelectedCustomer((prev) => (prev ? { ...prev, email } : null));
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  // Thêm số điện thoại mới vào danh bạ
  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoneInput.trim() || !selectedCustomer) return;
    const cleanPhone = newPhoneInput.trim();
    const currentList = Array.isArray(selectedCustomer.phone_numbers) ? [...selectedCustomer.phone_numbers] : [];
    if (!currentList.includes(cleanPhone)) {
      currentList.push(cleanPhone);
    }
    const newPrimary = selectedCustomer.phone || cleanPhone;

    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({
        phone: newPrimary,
        phone_numbers: currentList,
      })
      .eq("id", selectedCustomer.id);

    if (!error) {
      setSelectedCustomer((prev) =>
        prev ? { ...prev, phone: newPrimary, phone_numbers: currentList } : null
      );
      setNewPhoneInput("");
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  // Thêm email mới vào danh bạ
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !selectedCustomer) return;
    const cleanEmail = newEmailInput.trim();
    const currentList = Array.isArray(selectedCustomer.emails) ? [...selectedCustomer.emails] : [];
    if (!currentList.includes(cleanEmail)) {
      currentList.push(cleanEmail);
    }
    const newPrimary = selectedCustomer.email || cleanEmail;

    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({
        email: newPrimary,
        emails: currentList,
      })
      .eq("id", selectedCustomer.id);

    if (!error) {
      setSelectedCustomer((prev) =>
        prev ? { ...prev, email: newPrimary, emails: currentList } : null
      );
      setNewEmailInput("");
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  // Xóa số điện thoại khỏi danh bạ
  const handleRemovePhone = async (phoneToRemove: string) => {
    if (!selectedCustomer) return;
    const currentList = (selectedCustomer.phone_numbers || []).filter((p) => p !== phoneToRemove);
    const newPrimary = selectedCustomer.phone === phoneToRemove ? currentList[0] || null : selectedCustomer.phone;

    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({
        phone: newPrimary,
        phone_numbers: currentList,
      })
      .eq("id", selectedCustomer.id);

    if (!error) {
      setSelectedCustomer((prev) =>
        prev ? { ...prev, phone: newPrimary, phone_numbers: currentList } : null
      );
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  // Xóa email khỏi danh bạ
  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!selectedCustomer) return;
    const currentList = (selectedCustomer.emails || []).filter((e) => e !== emailToRemove);
    const newPrimary = selectedCustomer.email === emailToRemove ? currentList[0] || null : selectedCustomer.email;

    setIsUpdatingContact(true);
    const { error } = await supabase
      .from("customers")
      .update({
        email: newPrimary,
        emails: currentList,
      })
      .eq("id", selectedCustomer.id);

    if (!error) {
      setSelectedCustomer((prev) =>
        prev ? { ...prev, email: newPrimary, emails: currentList } : null
      );
      router.refresh();
    }
    setIsUpdatingContact(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header Toolbar */}
      <AdminTableToolbar
        title="Quản lý khách hàng (CRM)"
        totalCount={totalCount}
        subtitle="Hồ sơ 360°, phân hạng và lịch sử tương tác đa kênh"
        tabs={tabs}
        activeTabKey={currentTier}
        onTabChange={handleTabChange}
        density={density}
        onDensityChange={setDensity}
      />

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3.5 py-2.5">Khách hàng</th>
                <th className="px-3 py-2.5">Phân hạng CRM</th>
                <th className="px-3 py-2.5">Email</th>
                <th className="px-3 py-2.5">Số điện thoại</th>
                <th className="px-3 py-2.5 text-center">Đơn hàng & Doanh số</th>
                <th className="px-3 py-2.5 text-center">Hội thoại</th>
                <th className="px-3 py-2.5 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!customers || customers.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 text-sm">
                    <p>Không tìm thấy khách hàng nào.</p>
                  </td>
                </tr>
              )}
              {customers?.map((customer) => {
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3.5 py-2" : "px-3.5 py-3";
                const tierInfo = TIER_CONFIG[customer.tier || "STANDARD"] || TIER_CONFIG.STANDARD;
                
                // Calculate total spend
                const totalSpent = (customer.orders || []).reduce(
                  (sum, o) => sum + (Number(o.total_amount) || 0),
                  0
                );
                const orderCount = customer.orders?.length || 0;
                const convCount = customer.conversations?.length || 0;

                return (
                  <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Khách hàng */}
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#13426e]/10 text-[#13426e] font-bold text-xs flex items-center justify-center shrink-0">
                          {customer.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-xs md:text-sm block">
                            {customer.full_name}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Gia nhập {new Date(customer.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Phân hạng */}
                    <td className={cellPadding}>
                      <span className={`text-xs ${tierInfo.color}`}>
                        {tierInfo.label}
                      </span>
                    </td>

                    {/* Email */}
                    <td className={`${cellPadding} text-xs text-gray-600`}>
                      {customer.email ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{customer.email}</span>
                          {Array.isArray(customer.emails) && customer.emails.length > 1 && (
                            <span 
                              className="text-[10px] text-blue-700 font-medium"
                              title={`Có ${customer.emails.length} địa chỉ email: ${customer.emails.join(", ")}`}
                            >
                              (+{customer.emails.length - 1} email)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className={`${cellPadding} text-xs text-gray-600`}>
                      {customer.phone ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono">{customer.phone}</span>
                          {Array.isArray(customer.phone_numbers) && customer.phone_numbers.length > 1 && (
                            <span 
                              className="text-[10px] text-emerald-700 font-medium font-mono"
                              title={`Có ${customer.phone_numbers.length} số điện thoại: ${customer.phone_numbers.join(", ")}`}
                            >
                              (+{customer.phone_numbers.length - 1} số)
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Đơn hàng & Doanh số */}
                    <td className={`${cellPadding} text-center`}>
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-800">
                          {orderCount} đơn
                        </span>
                        {totalSpent > 0 && (
                          <span className="text-[10px] text-emerald-700 font-medium font-mono">
                            {totalSpent.toLocaleString("vi-VN")} đ
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Hội thoại chat */}
                    <td className={`${cellPadding} text-center`}>
                      {convCount > 0 ? (
                        <span className="text-xs font-semibold text-[#13426e]">
                          {convCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenCustomer(customer)}
                          className="p-1 text-gray-400 hover:text-[#13426e] transition-colors"
                          title="Xem hồ sơ CRM 360°"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => router.push(`/admin/hoi-thoai`)}
                          className="text-xs text-[#13426e] hover:underline font-medium"
                          title="Mở phòng chat"
                        >
                          Chat
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

      {/* ===================== MODAL: HỒ SƠ KHÁCH HÀNG CRM 360° ===================== */}
      <Modal 
        isOpen={!!selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
        title="Hồ sơ khách hàng 360° (CRM Nexera)"
      >
        {selectedCustomer && (
          <div className="space-y-5">
            {/* Header info card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#13426e]/10 text-[#13426e] flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{selectedCustomer.full_name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Thành viên từ {new Date(selectedCustomer.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              {/* Phân hạng Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Phân hạng:</span>
                <select
                  value={editingTier}
                  onChange={(e) => handleUpdateTier(e.target.value)}
                  disabled={isUpdatingTier}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 text-gray-800"
                >
                  <option value="STANDARD">Tiêu chuẩn</option>
                  <option value="POTENTIAL">Tiềm năng</option>
                  <option value="LOYAL">Thân thiết</option>
                  <option value="VIP">Khách VIP</option>
                </select>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-4 border-b border-gray-200 text-xs">
              <button
                onClick={() => setActiveModalTab("info")}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeModalTab === "info"
                    ? "border-[#13426e] text-[#13426e]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Thông tin liên hệ
              </button>
              <button
                onClick={() => setActiveModalTab("orders")}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeModalTab === "orders"
                    ? "border-[#13426e] text-[#13426e]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Đơn hàng ({selectedCustomer.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab("chat")}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeModalTab === "chat"
                    ? "border-[#13426e] text-[#13426e]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Lịch sử Chat ({selectedCustomer.conversations?.length || 0})
              </button>
              <button
                onClick={() => setActiveModalTab("notes")}
                className={`pb-2.5 font-semibold transition-colors border-b-2 ${
                  activeModalTab === "notes"
                    ? "border-[#13426e] text-[#13426e]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                Ghi chú CRM ({selectedCustomer.customer_notes?.length || 0})
              </button>
            </div>

            {/* Tab 1: Info & Multi-contact Directory */}
            {activeModalTab === "info" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DANH BẠ SỐ ĐIỆN THOẠI */}
                  <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800 text-xs">
                        Danh bạ Số điện thoại ({selectedCustomer.phone_numbers?.length || (selectedCustomer.phone ? 1 : 0)})
                      </h4>
                      <span className="text-[10px] text-gray-400">Nhiều thiết bị</span>
                    </div>

                    {/* Danh sách các số điện thoại */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {Array.from(
                        new Set([
                          ...(selectedCustomer.phone ? [selectedCustomer.phone] : []),
                          ...(Array.isArray(selectedCustomer.phone_numbers) ? selectedCustomer.phone_numbers : []),
                        ])
                      ).map((p) => {
                        const isPrimary = p === selectedCustomer.phone;
                        return (
                          <div
                            key={p}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                              isPrimary
                                ? "bg-white border-emerald-300"
                                : "bg-white/80 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-gray-900">{p}</span>
                              {isPrimary && (
                                <span className="text-[10px] font-bold text-emerald-700">
                                  (Chính)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {!isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryPhone(p)}
                                  disabled={isUpdatingContact}
                                  className="text-[10px] px-2 py-0.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                  title="Đặt làm số liên hệ chính"
                                >
                                  Đặt làm chính
                                </button>
                              )}
                              <button
                                onClick={() => handleRemovePhone(p)}
                                disabled={isUpdatingContact}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors"
                                title="Xóa số này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedCustomer.phone && (!selectedCustomer.phone_numbers || selectedCustomer.phone_numbers.length === 0)) && (
                        <p className="text-[11px] text-gray-400 italic">Chưa có số điện thoại nào.</p>
                      )}
                    </div>

                    {/* Form thêm số mới */}
                    <form onSubmit={handleAddPhone} className="flex gap-1.5 pt-1">
                      <input
                        type="tel"
                        placeholder="Thêm số điện thoại mới..."
                        value={newPhoneInput}
                        onChange={(e) => setNewPhoneInput(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={!newPhoneInput.trim() || isUpdatingContact}
                        className="px-3 py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-40"
                      >
                        Thêm số
                      </button>
                    </form>
                  </div>

                  {/* DANH BẠ EMAIL */}
                  <div className="bg-gray-50/70 border border-gray-200 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800 text-xs">
                        Danh bạ Email ({selectedCustomer.emails?.length || (selectedCustomer.email ? 1 : 0)})
                      </h4>
                      <span className="text-[10px] text-gray-400">Đa email</span>
                    </div>

                    {/* Danh sách các email */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {Array.from(
                        new Set([
                          ...(selectedCustomer.email ? [selectedCustomer.email] : []),
                          ...(Array.isArray(selectedCustomer.emails) ? selectedCustomer.emails : []),
                        ])
                      ).map((e) => {
                        const isPrimary = e === selectedCustomer.email;
                        return (
                          <div
                            key={e}
                            className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                              isPrimary
                                ? "bg-white border-blue-300"
                                : "bg-white/80 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate mr-2">
                              <span className="font-medium text-gray-900 truncate">{e}</span>
                              {isPrimary && (
                                <span className="text-[10px] font-bold text-blue-700 shrink-0">
                                  (Chính)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryEmail(e)}
                                  disabled={isUpdatingContact}
                                  className="text-[10px] px-2 py-0.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                  title="Đặt làm email liên hệ chính"
                                >
                                  Đặt làm chính
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveEmail(e)}
                                disabled={isUpdatingContact}
                                className="p-1 text-gray-400 hover:text-rose-600 rounded-md transition-colors"
                                title="Xóa email này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedCustomer.email && (!selectedCustomer.emails || selectedCustomer.emails.length === 0)) && (
                        <p className="text-[11px] text-gray-400 italic">Chưa có email nào.</p>
                      )}
                    </div>

                    {/* Form thêm email mới */}
                    <form onSubmit={handleAddEmail} className="flex gap-1.5 pt-1">
                      <input
                        type="email"
                        placeholder="Thêm email mới..."
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400"
                      />
                      <button
                        type="submit"
                        disabled={!newEmailInput.trim() || isUpdatingContact}
                        className="px-3 py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white rounded-lg text-xs font-semibold shrink-0 transition-colors disabled:opacity-40"
                      >
                        Thêm email
                      </button>
                    </form>
                  </div>
                </div>

                {/* Địa chỉ giao hàng */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[11px]">Địa chỉ giao hàng mặc định</span>
                  <span className="font-semibold text-gray-800 text-xs">
                    {selectedCustomer.address || "Chưa cập nhật địa chỉ"}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: Orders */}
            {activeModalTab === "orders" && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                  <p className="text-center py-8 text-gray-400 text-xs italic">
                    Khách hàng chưa có đơn hàng nào.
                  </p>
                ) : (
                  selectedCustomer.orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-[#13426e] block">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(order.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 block font-mono">
                          {Number(order.total_amount || 0).toLocaleString("vi-VN")} đ
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          {order.status || "COMPLETED"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Chat History */}
            {activeModalTab === "chat" && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(!selectedCustomer.conversations || selectedCustomer.conversations.length === 0) ? (
                  <p className="text-center py-8 text-gray-400 text-xs italic">
                    Chưa có lịch sử trò chuyện trực tiếp với khách hàng này.
                  </p>
                ) : (
                  selectedCustomer.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">Cuộc hội thoại</span>
                          <span className="text-[10px] text-blue-700 font-medium">
                            · {conv.status}
                          </span>
                        </div>
                        <p className="text-gray-500 truncate text-[11px]">
                          {conv.last_message_preview || "Tin nhắn trao đổi..."}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer(null);
                          router.push(`/admin/hoi-thoai`);
                        }}
                        className="px-3 py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white text-[11px] font-semibold rounded-lg shrink-0"
                      >
                        Mở chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 4: CRM Notes */}
            {activeModalTab === "notes" && (
              <div className="space-y-3">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    placeholder="Ghi chú về nhu cầu, cuộc gọi, nhắc hẹn khách hàng..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-gray-400 focus:bg-white resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNote.trim() || isAddingNote}
                      className="px-3 py-1.5 bg-[#13426e] hover:bg-[#1e5a92] text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {isAddingNote ? "Đang lưu..." : "Thêm ghi chú"}
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(!selectedCustomer.customer_notes || selectedCustomer.customer_notes.length === 0) ? (
                    <p className="text-center py-4 text-gray-400 text-xs italic">
                      Chưa có ghi chú nào cho khách hàng này.
                    </p>
                  ) : (
                    selectedCustomer.customer_notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1"
                      >
                        <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(note.created_at).toLocaleDateString("vi-VN")}{" "}
                          {new Date(note.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  router.push(`/admin/hoi-thoai`);
                }}
                className="px-4 py-2 bg-[#13426e] hover:bg-[#1e5a92] text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Nhắn tin với khách hàng
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
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
