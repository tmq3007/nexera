"use client";

import { X } from "lucide-react";

export type BulkAction = {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "danger" | "primary" | "default";
};

interface AdminBulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function AdminBulkActionBar({ selectedCount, onClearSelection, actions }: AdminBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-3 border-r border-gray-700 pr-6">
        <button 
          onClick={onClearSelection}
          className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
          title="Bỏ chọn"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="font-medium">Đã chọn <strong className="text-[var(--primary)] text-lg px-1">{selectedCount}</strong> dòng</span>
      </div>

      <div className="flex items-center gap-2">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          const variantClasses = {
            danger: "text-red-400 hover:text-white hover:bg-red-500",
            primary: "text-blue-400 hover:text-white hover:bg-blue-500",
            default: "text-gray-300 hover:text-white hover:bg-gray-800",
          };

          return (
            <button
              key={idx}
              onClick={action.onClick}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${variantClasses[action.variant || "default"]}`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
