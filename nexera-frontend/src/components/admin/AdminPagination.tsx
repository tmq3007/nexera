import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  totalItems: number;
  totalPages: number;
}

export function AdminPagination({
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  totalItems,
  totalPages,
}: AdminPaginationProps) {
  if (totalItems === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-100/90 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40 backdrop-blur-xs shrink-0">
      {/* Thông tin số lượng & Chọn số dòng */}
      <div className="flex items-center gap-2.5 text-xs text-gray-500">
        <span>
          Hiển thị{" "}
          <span className="font-semibold text-gray-800">
            {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{" "}
          / <span className="font-semibold text-gray-800">{totalItems}</span>
        </span>

        <span className="w-1 h-1 rounded-full bg-gray-300 hidden sm:inline-block" />

        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-gray-400">Số dòng:</span>
          <div className="relative inline-flex items-center">
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-200/90 rounded-lg pl-2 pr-5 py-0.5 text-xs font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all cursor-pointer shadow-2xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Điều hướng trang */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200/80 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs disabled:shadow-none"
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {(() => {
          const getPageNumbers = () => {
            if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
            if (currentPage <= 3) return [1, 2, 3, 4, "...", totalPages];
            if (currentPage >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
          };

          return getPageNumbers().map((pageNum, idx) =>
            pageNum === "..." ? (
              <span key={`ellipsis-${idx}`} className="w-6 text-center text-xs text-gray-400">
                •••
              </span>
            ) : (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => setCurrentPage(pageNum as number)}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[var(--primary)] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200/80 shadow-2xs hover:shadow-2xs"
                }`}
              >
                {pageNum}
              </button>
            )
          );
        })()}

        <button
          type="button"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="h-7 px-2 flex items-center gap-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-200/80 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs disabled:shadow-none"
          title="Trang sau"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
