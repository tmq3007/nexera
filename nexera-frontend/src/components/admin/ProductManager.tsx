"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ProductForm } from "./ProductForm";
import { ProductDetailView } from "./ProductDetailView";
import { AdminPagination } from "./AdminPagination";
import { useToast } from "@/contexts/ToastContext";

export function ProductManager({ products, categories }: { products: any[]; categories: any[] }) {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination logic
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil((products?.length || 0) / itemsPerPage);

  const currentProducts = products?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleOpenView = (product: any) => {
    setViewingProduct(product);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (product: any) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    
    const { error } = await supabase.from("products").delete().eq("id", deletingProduct.id);
    
    setIsDeleting(false);
    if (error) {
      toast.error(error.message || "Lỗi không xác định khi xóa sản phẩm");
    } else {
      toast.success("Xóa sản phẩm thành công!");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sản phẩm</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý danh sách sản phẩm và thiết bị
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm sản phẩm
        </button>
      </div>

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col min-h-0 flex-1">
        
        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 shadow-sm z-10">
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Tên sản phẩm</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Danh mục</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Thương hiệu</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Loại</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">Báo giá (VNĐ)</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">Tồn kho</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Chưa có sản phẩm nào.{" "}
                    <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline">
                      Thêm sản phẩm đầu tiên
                    </button>
                  </td>
                </tr>
              )}
              {currentProducts?.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                      )}
                      <div>
                        <button 
                          onClick={() => handleOpenView(product)}
                          className="font-medium text-[#13426E] hover:text-[#80BF49] hover:underline text-left transition-colors"
                        >
                          {product.name}
                        </button>
                        <p className="text-xs text-gray-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{(product.categories as { name: string } | null)?.name ?? "—"}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{product.brand || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${product.type === "EQUIPMENT" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                      {product.type === "EQUIPMENT" ? "Thiết bị" : "Gói lắp đặt"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <div className="text-gray-400">
                        <span className="text-[10px] uppercase font-semibold mr-2">Nhập</span>
                        {Number(product.import_price || 0).toLocaleString("vi-VN")}
                      </div>
                      <div className="font-bold text-[#E30019]">
                        <span className="text-[10px] uppercase font-semibold text-gray-400 mr-2">Bán</span>
                        {Number(product.price).toLocaleString("vi-VN")}
                      </div>
                      {(product.discount_rate > 0) && (
                        <div className="text-green-600 font-semibold text-xs bg-green-50 px-2 py-0.5 rounded-full">
                          Sale: {product.discount_rate}%
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>{product.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(product)}
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
        
        {/* Fixed Pagination Controls Footer */}
        <AdminPagination 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          totalItems={products?.length || 0}
          totalPages={totalPages}
        />
      </div>

      {/* Form Modal (Thêm/Sửa) */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
      >
        <ProductForm 
          initialData={editingProduct} 
          categories={categories} 
          onSuccess={() => {
            setIsFormOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Xác nhận xoá"
        message={<span>Bạn có chắc chắn muốn xoá sản phẩm <strong>{deletingProduct?.name}</strong>? Hành động này không thể hoàn tác.</span>}
        loading={isDeleting}
        confirmText="Xoá sản phẩm"
      />

      {/* View Detail Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Chi tiết sản phẩm"
      >
        <ProductDetailView product={viewingProduct} />
      </Modal>
    </div>
  );
}
