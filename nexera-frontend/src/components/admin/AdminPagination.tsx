import React from "react";

interface AdminPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
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
    <div className="px-6 py-4 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-white shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
        </span>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Số dòng:</span>
          <select 
            value={itemsPerPage} 
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded px-2 py-1 outline-none focus:border-[var(--primary)]"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-1">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          Trước
        </button>
        
        {(() => {
          const getPageNumbers = () => {
            if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
            if (currentPage <= 3) return [1, 2, 3, 4, '...', totalPages];
            if (currentPage >= totalPages - 2) return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
          };

          return getPageNumbers().map((pageNum, idx) => (
            pageNum === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 flex items-end">...</span>
            ) : (
              <button
                key={`page-${pageNum}`}
                onClick={() => setCurrentPage(pageNum as number)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "border text-gray-600 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            )
          ));
        })()}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded text-sm text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
