"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, Eye, Package } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { productsApi } from "@/lib/api/products.api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductDetailView } from "./ProductDetailView";
import { ProductForm } from "./ProductForm";
import { AdminPagination } from "./AdminPagination";
import { AdminFilterBar, FilterConfig } from "./AdminFilterBar";
import { AdminBulkActionBar } from "./AdminBulkActionBar";
import { AdminTableToolbar } from "./AdminTableToolbar";
import { useToast } from "@/contexts/ToastContext";
import { logActivity } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/messages";
import { imagePresets } from "@/utils/imageUtils";

export function ProductManager({
  products,
  categories,
  totalCount = 0,
  currentPage = 1,
  itemsPerPage = 10,
}: {
  products: any[];
  categories: any[];
  totalCount?: number;
  currentPage?: number;
  itemsPerPage?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toast = useToast();

  const [density, setDensity] = useState<"compact" | "normal">("compact");
  const [showFilters, setShowFilters] = useState(true);

  const [localProducts, setLocalProducts] = useState(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);
  const [deletingProduct, setDeletingProduct] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkMoveCategoryOpen, setIsBulkMoveCategoryOpen] = useState(false);
  const [bulkCategoryTarget, setBulkCategoryTarget] = useState("");

  const handleSelectAll = () => {
    if (selectedIds.length === localProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(localProducts.map(p => p.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} sản phẩm đã chọn?`)) return;
    setIsDeleting(true);
    const success = await productsApi.bulkUpdate({ ids: selectedIds, action: "delete" });
    setIsDeleting(false);
    if (success) {
      logActivity({
        action: "DELETE_PRODUCTS_BULK",
        entity_type: "products",
        details: { count: selectedIds.length, ids: selectedIds },
        severity: "WARNING",
      });
      toast.success(`Đã xóa ${selectedIds.length} sản phẩm!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const handleBulkToggleActive = async (targetState: boolean) => {
    const success = await productsApi.bulkUpdate({ ids: selectedIds, isActive: targetState });
    if (success) {
      logActivity({
        action: "TOGGLE_PRODUCTS_ACTIVE_BULK",
        entity_type: "products",
        details: { targetState, count: selectedIds.length, ids: selectedIds },
      });
      toast.success(`Đã ${targetState ? 'hiển thị' : 'ẩn'} ${selectedIds.length} sản phẩm!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error("Lỗi khi cập nhật trạng thái sản phẩm");
    }
  };

  const handleBulkMoveCategory = async () => {
    if (!bulkCategoryTarget) return;
    const success = await productsApi.bulkUpdate({ ids: selectedIds, categoryId: bulkCategoryTarget });
    if (success) {
      logActivity({
        action: "MOVE_PRODUCTS_CATEGORY_BULK",
        entity_type: "products",
        details: { category_id: bulkCategoryTarget, count: selectedIds.length, ids: selectedIds },
      });
      toast.success(`Đã chuyển danh mục cho ${selectedIds.length} sản phẩm!`);
      setSelectedIds([]);
      setIsBulkMoveCategoryOpen(false);
      setBulkCategoryTarget("");
      router.refresh();
    } else {
      toast.error("Lỗi khi chuyển danh mục");
    }
  };

  const handleToggleBestseller = async (product: any) => {
    const newStatus = !product.is_bestseller;
    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_bestseller: newStatus } : p));
    const success = await productsApi.bulkUpdate({ ids: [product.id], isBestseller: newStatus });
    if (success) {
      logActivity({
        action: "TOGGLE_PRODUCT_BESTSELLER",
        entity_type: "products",
        entity_id: product.id,
        details: { product_name: product.name, is_bestseller: newStatus },
      });
      router.refresh();
      toast.success(newStatus ? "Đã ghim Sản phẩm Bán Chạy!" : "Đã bỏ ghim Bán Chạy");
    } else {
      setLocalProducts(products);
      toast.error("Lỗi khi cập nhật cờ Bán Chạy");
    }
  };

  const handleBulkToggleBestseller = async (targetState: boolean) => {
    const success = await productsApi.bulkUpdate({ ids: selectedIds, isBestseller: targetState });
    if (success) {
      logActivity({
        action: "TOGGLE_PRODUCTS_BESTSELLER_BULK",
        entity_type: "products",
        details: { targetState, count: selectedIds.length, ids: selectedIds },
      });
      toast.success(`Đã ${targetState ? 'ghim Bán Chạy' : 'bỏ ghim Bán Chạy'} cho ${selectedIds.length} sản phẩm!`);
      setSelectedIds([]);
      router.refresh();
    } else {
      toast.error("Lỗi khi cập nhật cờ Bán Chạy hàng loạt");
    }
  };

  const handleToggleActive = async (product: any) => {
    const newStatus = !product.is_active;
    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: newStatus } : p));
    const success = await productsApi.bulkUpdate({ ids: [product.id], isActive: newStatus });
    if (success) {
      logActivity({
        action: "TOGGLE_PRODUCT_ACTIVE",
        entity_type: "products",
        entity_id: product.id,
        details: { product_name: product.name, new_status: newStatus },
      });
      router.refresh();
      toast.success(newStatus ? "Đã hiển thị sản phẩm" : "Đã ẩn sản phẩm");
    } else {
      setLocalProducts(products);
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

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
    setIsAddOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setIsEditOpen(true);
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

    const success = await productsApi.deleteProduct(deletingProduct.id);

    setIsDeleting(false);
    if (!success) {
      toast.error("Lỗi không xác định khi xóa sản phẩm");
    } else {
      logActivity({
        action: "DELETE_PRODUCT",
        entity_type: "products",
        entity_id: deletingProduct.id,
        details: { product_name: deletingProduct.name },
        severity: "WARNING",
      });
      toast.success("Xóa sản phẩm thành công!");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      router.refresh();
    }
  };

  const currentStatusTab = (() => {
    if (searchParams.get("is_bestseller") === "true") return "bestseller";
    if (searchParams.get("stock") === "out_of_stock") return "out_of_stock";
    if (searchParams.get("is_active") === "true") return "active";
    if (searchParams.get("is_active") === "false") return "inactive";
    return "all";
  })();

  const handleStatusTabChange = (tab: "all" | "active" | "bestseller" | "out_of_stock" | "inactive") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("is_active");
    params.delete("is_bestseller");
    params.delete("stock");
    params.delete("page");

    if (tab === "active") {
      params.set("is_active", "true");
    } else if (tab === "bestseller") {
      params.set("is_bestseller", "true");
    } else if (tab === "out_of_stock") {
      params.set("stock", "out_of_stock");
    } else if (tab === "inactive") {
      params.set("is_active", "false");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const filterKeys = ["category_id", "type", "price_min", "price_max", "sort_by"];
  const activeFiltersCount = filterKeys.filter(k => {
    const val = searchParams.get(k);
    if (!val) return false;
    if (k === "sort_by" && val === "created_at|desc") return false;
    return true;
  }).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)]">
      {/* Top Controls Bar: Reusable AdminTableToolbar */}
      <AdminTableToolbar
        tabs={[
          { key: "all", label: "Tất cả", count: totalCount },
          { key: "active", label: "Đang bán" },
          { key: "bestseller", label: "Bán chạy" },
          { key: "out_of_stock", label: "Hết hàng" },
          { key: "inactive", label: "Đang ẩn" },
        ]}
        activeTabKey={currentStatusTab}
        onTabChange={handleStatusTabChange}
        showFilterToggle={true}
        isFiltersOpen={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
        activeFiltersCount={activeFiltersCount}
        density={density}
        onDensityChange={setDensity}
        primaryAction={{
          label: "Thêm sản phẩm",
          icon: Plus,
          onClick: handleOpenAdd,
        }}
      />

      {/* Filters Bar (collapsible) */}
      {showFilters && (
        <div className="shrink-0 animate-in fade-in duration-200">
          <AdminFilterBar
            filters={[
              {
                key: "category_id",
                label: "Danh mục",
                type: "select",
                options: categories.map(c => ({ label: c.name, value: c.id }))
              },
              {
                key: "type",
                label: "Loại hình",
                type: "select",
                options: [
                  { label: "Thiết bị", value: "EQUIPMENT" },
                  { label: "Gói lắp đặt", value: "PACKAGE" }
                ]
              },
              {
                key: "price",
                label: "Khoảng giá",
                type: "price_range",
              },
              {
                key: "sort_by",
                label: "Sắp xếp",
                type: "sort",
                options: [
                  { label: "Mới nhất", value: "created_at|desc" },
                  { label: "Giá tăng dần", value: "price|asc" },
                  { label: "Giá giảm dần", value: "price|desc" },
                  { label: "Tồn kho thấp nhất", value: "stock|asc" },
                  { label: "Tên A→Z", value: "name|asc" },
                ]
              },
            ]}
          />
        </div>
      )}

      {/* Bulk Action Bar */}
      <AdminBulkActionBar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        actions={[
          {
            label: "Xóa",
            icon: Trash2,
            onClick: handleBulkDelete,
            variant: "danger"
          },
          {
            label: "Ghim Bán Chạy",
            icon: Star,
            onClick: () => handleBulkToggleBestseller(true),
            variant: "primary"
          },
          {
            label: "Bỏ ghim Bán Chạy",
            icon: Star,
            onClick: () => handleBulkToggleBestseller(false),
            variant: "default"
          },
          {
            label: "Ẩn hàng loạt",
            icon: Edit,
            onClick: () => handleBulkToggleActive(false),
            variant: "default"
          },
          {
            label: "Hiện hàng loạt",
            icon: Edit,
            onClick: () => handleBulkToggleActive(true),
            variant: "primary"
          },
          {
            label: "Đổi danh mục",
            icon: Edit,
            onClick: () => setIsBulkMoveCategoryOpen(true),
            variant: "default"
          }
        ]}
      />

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden flex flex-col min-h-0 flex-1 shadow-2xs">

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-xs shadow-2xs z-10">
              <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="text-center px-3 py-2.5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={localProducts.length > 0 && selectedIds.length === localProducts.length}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                </th>
                <th className="text-center px-2 py-2.5 w-10" title="Ghim sản phẩm Bán Chạy">Hot</th>
                <th className="px-3 py-2.5">Sản phẩm</th>
                <th className="px-3 py-2.5">Danh mục</th>
                <th className="px-3 py-2.5">Thương hiệu</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5 text-right">Báo giá (VNĐ)</th>
                <th className="px-3 py-2.5 text-right">Tồn kho</th>
                <th className="px-3 py-2.5 text-center">Trạng thái</th>
                <th className="px-3 py-2.5 text-center w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(!localProducts || localProducts.length === 0) && (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-gray-400 text-sm">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    Chưa có sản phẩm nào phù hợp bộ lọc.{" "}
                    <button onClick={handleOpenAdd} className="text-[var(--primary)] hover:underline font-semibold inline-block mt-2">
                      + Thêm sản phẩm mới
                    </button>
                  </td>
                </tr>
              )}
              {localProducts?.map((product) => {
                const isCompact = density === "compact";
                const cellPadding = isCompact ? "px-3 py-2" : "px-3 py-3";

                // Tính trạng thái tồn kho thông minh
                const stockQty = Number(product.stock || 0);

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className={`text-center ${cellPadding} w-10`}>
                      <input
                        type="checkbox"
                        onChange={() => handleSelectOne(product.id)}
                        checked={selectedIds.includes(product.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
                    <td className={`text-center ${cellPadding} w-10`}>
                      <button
                        onClick={() => handleToggleBestseller(product)}
                        className="p-1 transition-colors cursor-pointer"
                        title={product.is_bestseller ? "Bỏ ghim Bán chạy" : "Ghim Bán chạy"}
                      >
                        <Star className={`w-3.5 h-3.5 transition-colors ${product.is_bestseller ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`} />
                      </button>
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center gap-2.5">
                        {product.image_url ? (
                          <img
                            src={imagePresets.adminThumb(product.image_url) ?? product.image_url}
                            alt={product.name}
                            className={`${isCompact ? "w-8 h-8" : "w-10 h-10"} rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-200/80 shadow-2xs group-hover:scale-105 transition-transform`}
                          />
                        ) : (
                          <div className={`${isCompact ? "w-8 h-8" : "w-10 h-10"} rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-[10px] shrink-0 border border-gray-200/80`}>N/A</div>
                        )}
                        <div className="min-w-0">
                          <button
                            onClick={() => handleOpenView(product)}
                            className="font-semibold text-gray-900 hover:text-[var(--primary)] text-left transition-colors text-xs md:text-sm line-clamp-1"
                            title={product.name}
                          >
                            {product.name}
                          </button>
                          <p className="text-[11px] text-gray-400 font-mono truncate max-w-[200px] mt-0.5">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${cellPadding} text-xs text-gray-700 font-medium`}>
                      {(product.categories as { name: string } | null)?.name ?? "—"}
                    </td>
                    <td className={`${cellPadding} text-xs text-gray-700 font-semibold`}>
                      {product.brand || "—"}
                    </td>
                    <td className={`${cellPadding} text-xs text-gray-600 font-medium`}>
                      {product.type === "EQUIPMENT" ? "Thiết bị" : "Gói lắp đặt"}
                    </td>
                    <td className={`${cellPadding} text-right`}>
                      <div className="flex flex-col items-end">
                        <div className="font-bold text-gray-900 text-xs md:text-sm tracking-tight">
                          {Number(product.price).toLocaleString("vi-VN")}₫
                          {product.discount_rate > 0 && (
                            <span className="ml-1 text-[10px] text-rose-600 font-semibold">
                              -{product.discount_rate}%
                            </span>
                          )}
                        </div>
                        {product.import_price > 0 && (
                          <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                            Vốn: {Number(product.import_price).toLocaleString("vi-VN")}₫
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`${cellPadding} text-right text-xs font-semibold`}>
                      {stockQty > 10 ? (
                        <span className="text-emerald-600">{stockQty}</span>
                      ) : stockQty > 0 ? (
                        <span className="text-amber-600" title="Sắp hết hàng">{stockQty}</span>
                      ) : (
                        <span className="text-rose-600">Hết hàng</span>
                      )}
                    </td>
                    <td className={`${cellPadding} text-center`}>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors ${product.is_active ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
                        title={product.is_active ? "Đang hiển thị (Click để ẩn)" : "Đang ẩn (Click để hiện)"}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-2xs transition-transform ${product.is_active ? 'translate-x-4' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className={cellPadding}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenView(product)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-1 text-gray-400 hover:text-amber-600 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(product)}
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

        {/* Fixed Pagination Controls Footer */}
        <AdminPagination
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={handleLimitChange}
          totalItems={totalCount}
          totalPages={totalPages}
        />
      </div>

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
        maxWidth="max-w-5xl"
      >
        <ProductDetailView product={viewingProduct} />
      </Modal>

      {/* Edit Product Modal (Popup) */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingProduct(null);
        }}
        title={editingProduct?.name ? `Chỉnh sửa: ${editingProduct.name}` : "Chỉnh sửa sản phẩm"}
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 py-1 custom-scrollbar">
          <ProductForm
            initialData={editingProduct}
            categories={categories}
            onSuccess={() => {
              setIsEditOpen(false);
              setEditingProduct(null);
              router.refresh();
            }}
            onCancel={() => {
              setIsEditOpen(false);
              setEditingProduct(null);
            }}
          />
        </div>
      </Modal>

      {/* Add Product Modal (Popup) */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Thêm sản phẩm mới"
        maxWidth="max-w-4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto px-1 py-1 custom-scrollbar">
          <ProductForm
            categories={categories}
            onSuccess={() => {
              setIsAddOpen(false);
              router.refresh();
            }}
            onCancel={() => setIsAddOpen(false)}
          />
        </div>
      </Modal>

      {/* Modal Chuyển danh mục hàng loạt */}
      <Modal isOpen={isBulkMoveCategoryOpen} onClose={() => setIsBulkMoveCategoryOpen(false)} title="Chuyển danh mục hàng loạt">
        <div className="space-y-4 p-2">
          <p className="text-sm text-gray-600">Chọn danh mục mới cho <strong>{selectedIds.length}</strong> sản phẩm đã chọn:</p>
          <select
            value={bulkCategoryTarget}
            onChange={(e) => setBulkCategoryTarget(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-[var(--primary)] text-sm bg-gray-50 text-gray-700"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setIsBulkMoveCategoryOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm transition-colors font-medium">Hủy</button>
            <button
              onClick={handleBulkMoveCategory}
              disabled={!bulkCategoryTarget}
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              Chuyển danh mục
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
