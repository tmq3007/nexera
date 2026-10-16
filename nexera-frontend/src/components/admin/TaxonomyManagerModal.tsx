"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

export interface TaxonomyItem {
  id: string;
  name: string;
  product_count?: number;
}

interface TaxonomyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** "add" = chỉ hiện ô thêm nhanh; "manage" = danh sách + thêm/sửa/xóa */
  mode: "add" | "manage";
  /** VD: "thương hiệu", "loại", "danh mục" */
  entityLabel: string;
  /** Dòng phụ dưới tiêu đề, VD: "Thuộc thương hiệu: Vinsky" */
  subtitle?: string;
  placeholder?: string;
  items: TaxonomyItem[];
  selectedId?: string;
  onCreate: (name: string) => Promise<TaxonomyItem | null>;
  onRename: (id: string, name: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  /** Gọi khi chọn 1 mục (sau khi thêm mới, hoặc bấm "Chọn" trong danh sách) */
  onSelect?: (item: TaxonomyItem) => void;
  /** Cảnh báo riêng khi xóa (VD: xóa hãng sẽ xóa luôn các loại của hãng) */
  deleteHint?: string;
}

/**
 * Popup quản lý nhanh Danh mục / Thương hiệu / Loại.
 * - Render qua portal (không bị ảnh hưởng bởi modal cha, không lồng <form> -> không submit nhầm form sản phẩm).
 * - Thêm xong tự chọn mục mới.
 */
export function TaxonomyManagerModal({
  isOpen,
  onClose,
  mode,
  entityLabel,
  subtitle,
  placeholder,
  items,
  selectedId,
  onCreate,
  onRename,
  onDelete,
  onSelect,
  deleteHint,
}: TaxonomyManagerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setNewName("");
      setSearch("");
      setEditingId(null);
      setConfirmDeleteId(null);
      setTimeout(() => addInputRef.current?.focus(), 50);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const trimmed = newName.trim();
  const duplicate = items.some((i) => i.name.trim().toLowerCase() === trimmed.toLowerCase());

  const handleCreate = async () => {
    if (!trimmed || creating) return;
    if (duplicate) {
      const existing = items.find((i) => i.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (existing && onSelect) {
        onSelect(existing);
        onClose();
      }
      return;
    }
    setCreating(true);
    const created = await onCreate(trimmed);
    setCreating(false);
    if (created) {
      setNewName("");
      if (onSelect) onSelect(created);
      if (mode === "add") onClose();
    }
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    setBusyId(id);
    const ok = await onRename(id, name);
    setBusyId(null);
    if (ok) setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const ok = await onDelete(id);
    setBusyId(null);
    if (ok) setConfirmDeleteId(null);
  };

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  const title = mode === "add" ? `Thêm ${entityLabel} mới` : `Quản lý ${entityLabel}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-white rounded-2xl shadow-2xl w-full ${mode === "add" ? "max-w-md" : "max-w-lg"} max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 first-letter:uppercase">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thêm mới */}
        <div className="px-5 pt-4 pb-3">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 first-letter:uppercase">
            Tên {entityLabel} mới
          </label>
          <div className="flex gap-2">
            <input
              ref={addInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreate();
                }
              }}
              placeholder={placeholder || `Nhập tên ${entityLabel}...`}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!trimmed || creating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {duplicate ? "Chọn" : "Thêm"}
            </button>
          </div>
          {duplicate && trimmed && (
            <p className="text-[11px] text-amber-600 mt-1.5">
              &quot;{trimmed}&quot; đã có sẵn — bấm <b>Chọn</b> để dùng luôn.
            </p>
          )}
        </div>

        {/* Danh sách quản lý */}
        {mode === "manage" && (
          <>
            <div className="px-5 pb-2 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold text-gray-500">
                {items.length} {entityLabel}
              </span>
              {items.length > 6 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                    placeholder="Tìm..."
                    className="pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg w-40 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}
            </div>

            <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
              {filtered.length === 0 && (
                <li className="text-center text-sm text-gray-400 py-8">
                  {items.length === 0 ? `Chưa có ${entityLabel} nào.` : "Không tìm thấy."}
                </li>
              )}
              {filtered.map((item) => {
                const isEditing = editingId === item.id;
                const isConfirming = confirmDeleteId === item.id;
                const isBusy = busyId === item.id;
                const isSelected = selectedId === item.id;
                const count = item.product_count ?? 0;

                return (
                  <li
                    key={item.id}
                    className={`group rounded-lg px-2 py-1.5 transition-colors ${isConfirming ? "bg-rose-50" : isSelected ? "bg-[var(--primary)]/5" : "hover:bg-gray-50"}`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRename(item.id);
                            }
                            if (e.key === "Escape") {
                              e.stopPropagation();
                              setEditingId(null);
                            }
                          }}
                          className="flex-1 min-w-0 px-2 py-1 text-sm border border-[var(--primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleRename(item.id)}
                          disabled={isBusy}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md"
                          aria-label="Lưu"
                        >
                          {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-md"
                          aria-label="Hủy"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isConfirming ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-rose-700 truncate">Xóa &quot;{item.name}&quot;?</p>
                          <p className="text-[11px] text-rose-600/80">
                            {count > 0
                              ? `${count} sản phẩm sẽ bị gỡ ${entityLabel} (sản phẩm không bị xóa).`
                              : "Không có sản phẩm nào đang dùng."}
                            {deleteHint ? ` ${deleteHint}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isBusy}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md inline-flex items-center gap-1"
                        >
                          {isBusy && <Loader2 className="w-3 h-3 animate-spin" />} Xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-white rounded-md"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelect) {
                              onSelect(item);
                              onClose();
                            }
                          }}
                          className="flex-1 min-w-0 text-left flex items-center gap-2"
                          title={onSelect ? "Chọn" : undefined}
                        >
                          <span className={`text-sm truncate ${isSelected ? "font-semibold text-[var(--primary)]" : "text-gray-800"}`}>
                            {item.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />}
                        </button>
                        <span className="text-[11px] text-gray-400 tabular-nums shrink-0">{count} SP</span>
                        <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditName(item.name);
                              setConfirmDeleteId(null);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                            aria-label={`Đổi tên ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(item.id);
                              setEditingId(null);
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                            aria-label={`Xóa ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
