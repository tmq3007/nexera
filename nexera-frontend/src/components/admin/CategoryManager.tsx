"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { productsApi } from "@/lib/api/products.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CategoryForm } from "./CategoryForm";
import { AdminPagination } from "./AdminPagination";
import { logActivity } from "@/lib/logger";
import { AdminTableToolbar } from "./AdminTableToolbar";

export function CategoryManager({ 
  categories,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: { 
  categories: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
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
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (category: any) => {
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);

    const success = await productsApi.deleteCategory(deletingCategory.id);
    
    setIsDeleting(false);
    if (!success) {
      alert("Lỗi khi xóa danh mục hoặc danh mục đang có sản phẩm liên kết!");
    } else {
      logActivity({
        action: "DELETE_CATEGORY",
        entity_type: "products",
        entity_id: deletingCategory.id,
        details: { category_name: deletingCategory.name },
        severity: "WARNING",
      });
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      router.refresh();
    }
  };

  const [density, setDensity] = useState<"compact" | "normal">("compact");

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Header Toolbar */}
      <AdminTableToolbar
        density={density}
        onDensityChange={setDensity}
        primaryAction={{
          label: "Thêm danh mục",
          onClick: handleOpenAdd,
        }}
      />

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-3 py-2.5">Tên danh mục</th>
                <th className="px-3 py-2.5">Đường dẫn (Slug)</th>
                <th className="px-3 py-2.5">Mô tả</th>
                <th className="px-3 py-2.5 text-center w-20">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!categories || categories.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-400 text-sm">
                    <Tags className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p>Chưa có danh mục nào. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline font-semibold block mt-1">+ Thêm danh mục đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {categories?.map((category) => {
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                return (
                  <tr key={category.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className={`${cellPadding} font-semibold text-gray-900 text-xs md:text-sm`}>
                      {category.name}
                    </td>
                    <td className={cellPadding}>
                      <span className="font-mono text-xs text-gray-500">
                        {category.slug}
                      </span>
                    </td>
                    <td className={`${cellPadding} text-gray-500 text-xs truncate max-w-md`}>
                      {category.description || "—"}
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(category)}
                          className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(category)}
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

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"} maxWidth="max-w-lg">
        <CategoryForm 
          initialData={editingCategory} 
          onSuccess={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xoá"
        message={<span>Bạn có chắc chắn muốn xoá danh mục <strong>{deletingCategory?.name}</strong>? Hành động này không thể hoàn tác.</span>}
        loading={isDeleting}
        confirmText="Xoá danh mục"
      />
    </div>
  );
}
