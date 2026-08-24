"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Newspaper, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ArticleForm } from "./ArticleForm";

export function ArticleManager({ articles }: { articles: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    
    const { error } = await supabase.from("articles").delete().eq("id", deletingArticle.id);
    
    setIsDeleting(false);
    if (error) {
      alert("Lỗi khi xoá: " + error.message);
    } else {
      setIsDeleteOpen(false);
      setDeletingArticle(null);
      router.refresh();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bài viết</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý tin tức và bài viết blog</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Tiêu đề</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Slug</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Ngày đăng</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!articles || articles.length === 0) && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">
                    <Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Chưa có bài viết nào. <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline">Viết bài đầu tiên</button></p>
                  </td>
                </tr>
              )}
              {articles?.map((article) => (
                <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.title} className="w-12 h-8 rounded object-cover bg-gray-100" />
                      ) : (
                        <div className="w-12 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400"><Newspaper className="w-4 h-4" /></div>
                      )}
                      <span className="font-medium text-gray-800">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs font-mono">{article.slug}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(article.published_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(article)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(article)}
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

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingArticle ? "Chỉnh sửa bài viết" : "Viết bài mới"}>
        <ArticleForm 
          initialData={editingArticle} 
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
        message={<span>Bạn có chắc chắn muốn xoá bài viết <strong>{deletingArticle?.title}</strong>? Hành động này không thể hoàn tác.</span>}
        loading={isDeleting}
        confirmText="Xoá bài viết"
      />
    </>
  );
}
