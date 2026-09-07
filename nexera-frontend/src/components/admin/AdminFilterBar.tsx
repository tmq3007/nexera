"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X, ChevronDown, ArrowUpDown } from "lucide-react";
import { useState } from "react";

export type FilterConfig =
  | {
      key: string;
      label: string;
      type: "select";
      options: { label: string; value: string }[];
    }
  | {
      key: string;
      label: string;
      type: "date";
      options?: never;
    }
  | {
      key: string;
      label: string;
      type: "price_range";
      options?: never;
    }
  | {
      key: string;
      label: string;
      type: "sort";
      options: { label: string; value: string }[];
    };

interface AdminFilterBarProps {
  filters: FilterConfig[];
}

export function AdminFilterBar({ filters }: AdminFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Giá tạm cho price_range (chỉ push khi nhấn Enter / blur)
  const [priceMin, setPriceMin] = useState(
    searchParams.get("price_min") ?? ""
  );
  const [priceMax, setPriceMax] = useState(
    searchParams.get("price_max") ?? ""
  );

  const allFilterKeys = filters.flatMap((f) =>
    f.type === "price_range" ? [`${f.key}_min`, `${f.key}_max`] : [f.key]
  );

  const hasActiveFilters = allFilterKeys.some((k) => searchParams.has(k));

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceMin) params.set("price_min", priceMin);
    else params.delete("price_min");
    if (priceMax) params.set("price_max", priceMax);
    else params.delete("price_max");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    allFilterKeys.forEach((k) => params.delete(k));
    params.delete("page");
    setPriceMin("");
    setPriceMax("");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-3 bg-white p-2 md:px-3 md:py-2 rounded-xl border border-gray-200/80 shadow-2xs">
      <div className="flex items-center gap-1.5 text-gray-500 font-semibold text-xs mr-1 border-r border-gray-200 pr-2.5 shrink-0">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        <span>Lọc</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 flex-1">
        {filters.map((filter) => {
          if (filter.type === "select") {
            const currentVal = searchParams.get(filter.key) ?? "all";
            const isActive = currentVal !== "all";

            return (
              <div key={filter.key} className="relative shrink-0">
                <select
                  value={currentVal}
                  onChange={(e) => updateParam(filter.key, e.target.value)}
                  className={`appearance-none text-xs rounded-lg pl-2.5 pr-7 py-1.5 outline-none transition-all cursor-pointer font-medium border ${
                    isActive
                      ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs"
                      : "bg-gray-50/80 hover:bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <option value="all">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
                  isActive ? "text-emerald-700" : "text-gray-400"
                }`} />
              </div>
            );
          }

          if (filter.type === "date") {
            return (
              <div
                key={filter.key}
                className="flex items-center border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50/80 focus-within:bg-white focus-within:border-[var(--primary)] transition-all shrink-0"
              >
                <span className="text-[11px] text-gray-400 mr-1.5 font-medium">{filter.label}</span>
                <input
                  type="date"
                  value={searchParams.get(filter.key) ?? ""}
                  onChange={(e) => updateParam(filter.key, e.target.value)}
                  className="text-xs outline-none bg-transparent text-gray-700 cursor-pointer"
                />
              </div>
            );
          }

          if (filter.type === "price_range") {
            const isPriceActive = Boolean(priceMin || priceMax);

            return (
              <div
                key={`${filter.key}_range`}
                className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 transition-all shrink-0 ${
                  isPriceActive
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs"
                    : "bg-gray-50/80 focus-within:bg-white border-gray-200 focus-within:border-gray-300 text-gray-700"
                }`}
              >
                <span className="text-[11px] text-gray-400 font-semibold shrink-0">Giá</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Từ"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  onBlur={applyPriceRange}
                  onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
                  className="w-16 md:w-20 text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400"
                />
                <span className="text-gray-300 text-xs">—</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Đến"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  onBlur={applyPriceRange}
                  onKeyDown={(e) => e.key === "Enter" && applyPriceRange()}
                  className="w-16 md:w-20 text-xs outline-none bg-transparent text-gray-800 placeholder-gray-400"
                />
                <span className="text-[10px] text-gray-400 font-bold">₫</span>
              </div>
            );
          }

          if (filter.type === "sort") {
            const currentSort = searchParams.get(filter.key) ?? "all";
            const isSortActive = currentSort !== "all" && currentSort !== "created_at|desc";

            return (
              <div key={filter.key} className="ml-auto relative shrink-0">
                <select
                  value={currentSort}
                  onChange={(e) => updateParam(filter.key, e.target.value)}
                  className={`appearance-none text-xs rounded-lg pl-7 pr-7 py-1.5 outline-none transition-all cursor-pointer font-semibold border ${
                    isSortActive
                      ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                      : "bg-gray-50/80 hover:bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <option value="all">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            );
          }

          return null;
        })}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200/80 px-2.5 py-1 rounded-lg transition-all shrink-0 font-medium ml-1"
          >
            <X className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>
    </div>
  );
}
