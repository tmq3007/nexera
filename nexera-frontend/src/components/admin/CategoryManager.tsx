"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { CategoryForm } from "./CategoryForm";

export function CategoryManager({ categories }: { categories: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    // Check if there are products in this category
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("category_id", deletingCategory.id);
      
    if (count && count > 0) {
      alert(`Không thể xóa danh mục này vì đang có ${count} sản phẩm thuộc danh mục. Vui lòng chuyển các sản phẩm sang danh mục khác trước.`);
      setIsDeleting(false);
      setIsDeleteOpen(false);
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", deletingCategory.id);
    
    setIsDeleting(false);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
    } else {
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh mục</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý danh mục sản phẩm</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Tên danh mục</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Mô tả</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!categories || categories.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <Tags className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có danh mục nào. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline">Thêm danh mục đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {categories?.map((category) => (
                <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{category.name}</td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono">{category.slug}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs truncate max-w-xs">{category.description || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(category)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xoá"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </>
  );
}
