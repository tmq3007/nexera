"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

export interface SpecRow {
  id: string;
  key: string;
  value: string;
}

interface SpecificationsEditorProps {
  value?: Record<string, any> | null;
  onChange: (value: Record<string, string>) => void;
}

/**
 * Chuyển object JSONB specifications sang mảng rows với unique id
 */
function objectToRows(obj?: Record<string, any> | null): SpecRow[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj).map(([key, value], idx) => ({
    id: `spec-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    key,
    value: value !== null && value !== undefined ? String(value) : "",
  }));
}

/**
 * Chuyển mảng rows ngược lại về object JSONB để lưu vào DB.
 * Lọc bỏ các row mà cả key và value đều rỗng.
 */
function rowsToObject(rows: SpecRow[]): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const trimmedKey = row.key.trim();
    if (trimmedKey) {
      acc[trimmedKey] = row.value;
    }
    return acc;
  }, {});
}

export function SpecificationsEditor({
  value,
  onChange,
}: SpecificationsEditorProps) {
  // Local state quản lý các dòng thông số, giúp tương tác gõ chữ mượt mà và không mất dòng mới
  const [rows, setRows] = useState<SpecRow[]>(() => objectToRows(value));
  const keyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isInternalChange = useRef(false);

  // Đồng bộ khi prop `value` thay đổi từ bên ngoài (ví dụ đổi sản phẩm)
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    setRows(objectToRows(value));
  }, [value]);

  const notifyChange = (updatedRows: SpecRow[]) => {
    isInternalChange.current = true;
    onChange(rowsToObject(updatedRows));
  };

  const handleAddRow = () => {
    const newRow: SpecRow = {
      id: `spec-new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      key: "",
      value: "",
    };
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    notifyChange(nextRows);

    // Tự động focus vào ô Tên thông số vừa tạo
    setTimeout(() => {
      const lastIndex = nextRows.length - 1;
      keyRefs.current[lastIndex]?.focus();
    }, 60);
  };

  const handleRemoveRow = (id: string) => {
    const nextRows = rows.filter((r) => r.id !== id);
    setRows(nextRows);
    notifyChange(nextRows);
  };

  const handleChangeKey = (id: string, newKey: string) => {
    const nextRows = rows.map((r) => (r.id === id ? { ...r, key: newKey } : r));
    setRows(nextRows);
    notifyChange(nextRows);
  };

  const handleChangeValue = (id: string, newValue: string) => {
    const nextRows = rows.map((r) => (r.id === id ? { ...r, value: newValue } : r));
    setRows(nextRows);
    notifyChange(nextRows);
  };

  // Nhấn Tab từ ô Giá trị của dòng cuối cùng -> Tự động thêm dòng mới
  const handleValueKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey && index === rows.length - 1) {
      e.preventDefault();
      handleAddRow();
    }
  };

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="text-sm text-gray-500 text-center py-6 bg-gray-50/80 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2">
          <span>Chưa có thông số kỹ thuật nào.</span>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:text-[var(--primary)] hover:border-[var(--primary)] rounded-lg shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Thêm thông số đầu tiên</span>
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
          {/* Header */}
          <div className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 bg-gray-50 border-b border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
            <span />
            <span>Tên thông số</span>
            <span>Giá trị</span>
            <span />
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="grid grid-cols-[28px_1fr_1fr_36px] gap-2 items-center px-3 py-2 hover:bg-gray-50/50 transition-colors"
              >
                {/* Visual drag handle */}
                <div className="flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Ô nhập Tên thông số */}
                <div>
                  <input
                    ref={(el) => {
                      keyRefs.current[index] = el;
                    }}
                    type="text"
                    value={row.key}
                    onChange={(e) => handleChangeKey(row.id, e.target.value)}
                    placeholder="VD: Công suất, Điện áp..."
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-gray-300 shadow-2xs"
                  />
                </div>

                {/* Ô nhập Giá trị */}
                <div>
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleChangeValue(row.id, e.target.value)}
                    onKeyDown={(e) => handleValueKeyDown(e, index)}
                    placeholder="VD: 550W, 220V..."
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm text-gray-800 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-gray-300 shadow-2xs"
                  />
                </div>

                {/* Nút Xóa dòng */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(row.id)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                    title="Xóa thông số này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nút Thêm thông số */}
      {rows.length > 0 && (
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[var(--primary)]/30"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm thông số</span>
        </button>
      )}
    </div>
  );
}
