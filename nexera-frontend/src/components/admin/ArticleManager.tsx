"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Newspaper, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { contentApi } from "@/lib/api/content.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArticleForm } from "./ArticleForm";
import { AdminPagination } from "./AdminPagination";
import { logActivity } from "@/lib/logger";
import { AdminFilterBar } from "./AdminFilterBar";
import { AdminTableToolbar } from "./AdminTableToolbar";

export function ArticleManager({ 
  articles,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  articles: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);

  // Auto-open modal if URL has ?action=create
  useEffect(() => {
    if (searchParams.get("action") === "create") {
      setEditingArticle(null);
      setIsFormOpen(true);
    }
  }, [searchParams]);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    if (searchParams.get("action")) {
      const params = new URLSearchParams(searchParams);
      params.delete("action");
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
    }
  };
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleOpenAdd = () => {
    setEditingArticle(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (article: any) => {
    setEditingArticle(article);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (article: any) => {
    setDeletingArticle(article);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;
    setIsDeleting(true);
    
    const success = await contentApi.deleteArticle(deletingArticle.id);
    
    setIsDeleting(false);
    if (!success) {
      alert("Lỗi khi xoá bài viết!");
    } else {
      logActivity({
        action: "DELETE_ARTICLE",
        entity_type: "articles",
        entity_id: deletingArticle.id,
        details: { title: deletingArticle.title },
        severity: "WARNING",
      });
      setIsDeleteOpen(false);
      setDeletingArticle(null);
      router.refresh();
    }
  };

  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveDateFilter = Boolean(searchParams.get("date"));

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header Toolbar */}
      <AdminTableToolbar
        showFilterToggle={true}
        filterToggleLabel="Lọc ngày"
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters((prev) => !prev)}
        activeFiltersCount={hasActiveDateFilter ? 1 : 0}
        density={density}
        onDensityChange={setDensity}
        primaryAction={{
          label: "Viết bài mới",
          onClick: handleOpenAdd,
        }}
      />

      {/* Date Filter (collapsible) */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar 
            filters={[
              {
                key: "date",
                label: "Ngày xuất bản",
                type: "date"
              }
            ]}
          />
        </div>
      )}

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Tiêu đề bài viết</th>
                <th className="px-3 py-2.5">Đường dẫn (Slug)</th>
                <th className="px-3 py-2.5">Ngày đăng</th>
                <th className="px-3 py-2.5 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!articles || articles.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                    <Newspaper className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có bài viết nào phù hợp bộ lọc. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline font-semibold block mt-1">+ Viết bài đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {articles?.map((article) => {
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                return (
                  <tr key={article.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2.5">
                        {article.image_url ? (
                          <img src={article.image_url} alt={article.title} className="w-10 h-8 rounded-md object-cover bg-gray-100 shrink-0 border border-gray-200/80 shadow-2xs" />
                        ) : (
                          <div className="w-10 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 border border-gray-200/80"><Newspaper className="w-3.5 h-3.5" /></div>
                        )}
                        <span className="font-semibold text-gray-900 text-xs md:text-sm line-clamp-1">{article.title}</span>
                      </div>
                    </td>
                    <td className={cellPadding}>
                      <span className="font-mono text-xs text-gray-500 truncate max-w-[200px] block">
                        {article.slug}
                      </span>
                    </td>
                    <td className={`${cellPadding} text-gray-500 text-xs`}>
                      {new Date(article.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(article)}
                          className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(article)}
                          className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Xoá"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingArticle ? "Chỉnh sửa bài viết" : "Viết bài mới"}>
        <ArticleForm 
          initialData={editingArticle} 
          onSuccess={() => {
            handleCloseForm();
            router.refresh();
          }}
          onCancel={handleCloseForm}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xoá"
        message={<span>Bạn có chắc chắn muốn xoá bài viết <strong>{deletingArticle?.title}</strong>? Hành động này không thể hoàn tác.</span>}
        loading={isDeleting}
        confirmText="Xoá bài viết"
      />
    </div>
  );
}
