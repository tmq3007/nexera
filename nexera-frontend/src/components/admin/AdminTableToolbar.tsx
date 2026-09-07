"use client";

import React from "react";
import { Filter, ListCollapse, Rows, Plus } from "lucide-react";

export interface StatusTabItem {
  key: string;
  label: string;
  count?: number;
  dotColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface AdminTableToolbarProps {
  /** Danh sách các tab trạng thái phân đoạn (Shopify-style) */
  tabs?: StatusTabItem[];
  activeTabKey?: string;
  onTabChange?: (key: any) => void;

  /** Tiêu đề (hiển thị khi không có tabs hoặc ở màn hình lớn) */
  title?: string;
  totalCount?: number;
  subtitle?: string;

  /** Toggle Ẩn/Hiện Bộ lọc nâng cao */
  showFilterToggle?: boolean;
  filterToggleLabel?: string;
  isFiltersOpen?: boolean;
  onToggleFilters?: () => void;
  activeFiltersCount?: number;

  /** Toggle Mật độ dòng (Gọn / Chuẩn) */
  density?: "compact" | "normal";
  onDensityChange?: (density: "compact" | "normal") => void;

  /** Nút hành động chính (+ Thêm mới) */
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
}

export function AdminTableToolbar({
  tabs,
  activeTabKey = "all",
  onTabChange,
  title,
  totalCount,
  subtitle,
  showFilterToggle = false,
  filterToggleLabel = "Bộ lọc",
  isFiltersOpen = false,
  onToggleFilters,
  activeFiltersCount = 0,
  density = "compact",
  onDensityChange,
  primaryAction,
}: AdminTableToolbarProps) {
  const hasTabs = tabs && tabs.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
      {/* Bên trái: Status Tabs HOẶC Tiêu đề trang */}
      <div className="flex items-center gap-3">
        {hasTabs ? (
          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/70 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTabKey === tab.key;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange?.(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-white text-gray-900 shadow-2xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${tab.dotColor}`} />
                  )}
                  {TabIcon && <TabIcon className="w-3 h-3 text-amber-500 fill-amber-500" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="text-[11px] text-gray-400 font-normal">
                      ({tab.count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : title ? (
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {title}
              {totalCount !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {totalCount}
                </span>
              )}
            </h1>
            {subtitle && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                | {subtitle}
              </span>
            )}
          </div>
        ) : null}
      </div>

      {/* Bên phải: Nút Bộ lọc, Mật độ dòng và Nút Thêm mới */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Toggle Bộ lọc nâng cao */}
        {showFilterToggle && (
          <button
            type="button"
            onClick={onToggleFilters}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isFiltersOpen
                ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs"
            }`}
            title="Ẩn / Hiện bộ lọc"
          >
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <span>{filterToggleLabel}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-[var(--primary)] text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}

        {/* Toggle Mật độ dòng (Gọn / Chuẩn) */}
        {onDensityChange && (
          <div
            className="flex items-center bg-gray-100/90 rounded-xl p-0.5 border border-gray-200/70"
            title="Mật độ hiển thị"
          >
            <button
              type="button"
              onClick={() => onDensityChange("compact")}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                density === "compact"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Chế độ thu gọn"
            >
              <ListCollapse className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Gọn</span>
            </button>
            <button
              type="button"
              onClick={() => onDensityChange("normal")}
              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                density === "normal"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Chế độ chuẩn"
            >
              <Rows className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Chuẩn</span>
            </button>
          </div>
        )}

        {/* Nút hành động chính (+ Thêm mới) */}
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-xl transition-all font-semibold text-xs shadow-xs hover:shadow-sm active:scale-98 cursor-pointer"
          >
            {primaryAction.icon ? (
              <primaryAction.icon className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
