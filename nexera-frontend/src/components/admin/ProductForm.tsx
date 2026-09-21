"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { productsApi } from "@/lib/api/products.api";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { SpecificationsEditor } from "@/components/ui/SpecificationsEditor";
import { useToast } from "@/contexts/ToastContext";
import { logActivity } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/messages";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, categories, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    category_id: initialData?.category_id || "",
    type: initialData?.type || "EQUIPMENT",
    price: initialData?.price || "",
    import_price: initialData?.import_price || "",
    discount_rate: initialData?.discount_rate || "",
    stock: initialData?.stock || "",
    description: initialData?.description || "",
    image_url: initialData?.image_url || "",
    is_active: initialData?.is_active ?? true,
    is_bestseller: initialData?.is_bestseller ?? false,
    restock_date: initialData?.restock_date ? new Date(initialData.restock_date).toISOString().split('T')[0] : "",
    gallery: initialData?.gallery || [],
    specifications: initialData?.specifications || {},
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    brand: initialData?.brand || "",
    sku: initialData?.sku || "",
    origin: initialData?.origin || "",
    warranty_info: initialData?.warranty_info || "",
    supplier: initialData?.supplier || "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) || !prev.slug ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const price = Number(form.price) || 0;
    const importPrice = Number(form.import_price) || 0;
    const discountRate = Number(form.discount_rate) || 0;
    const salePrice = price * (1 - discountRate / 100);

    // Validation: Giá bán sau sale phải lớn hơn hoặc bằng giá nhập kho
    if (importPrice > 0 && salePrice < importPrice) {
      setLoading(false);
      toast.error(
        `Giá sau giảm (${new Intl.NumberFormat('vi-VN').format(salePrice)} ₫) không được thấp hơn giá nhập kho (${new Intl.NumberFormat('vi-VN').format(importPrice)} ₫)!`
      );
      return;
    }

    const dataToSave = {
      name: form.name,
      slug: form.slug,
      category_id: form.category_id || null,
      type: form.type,
      price,
      import_price: importPrice,
      discount_rate: discountRate,
      stock: Number(form.stock) || 0,
      description: form.description ? form.description.replace(/&nbsp;/g, " ") : null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      is_bestseller: form.is_bestseller,
      restock_date: form.restock_date ? new Date(form.restock_date).toISOString() : null,
      gallery: form.gallery,
      specifications: Object.keys(form.specifications).length > 0 ? form.specifications : null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      brand: form.brand || null,
      sku: form.sku || null,
      origin: form.origin || null,
      warranty_info: form.warranty_info || null,
      supplier: form.supplier || null,
    };

    let result;

    if (initialData?.id) {
      // Update
      result = await productsApi.updateProduct(initialData.id, dataToSave);
      if (result) {
        logActivity({
          action: "UPDATE_PRODUCT",
          entity_type: "products",
          entity_id: initialData.id,
          details: { product_name: form.name, changes: dataToSave },
        });
      }
    } else {
      // Insert
      result = await productsApi.createProduct(dataToSave);
      if (result) {
        logActivity({
          action: "CREATE_PRODUCT",
          entity_type: "products",
          entity_id: result?.id,
          details: { product_name: form.name, data: dataToSave },
        });
      }
    }

    setLoading(false);

    if (!result) {
      toast.error("Lỗi không xác định khi lưu sản phẩm");
    } else {
      toast.success("Lưu sản phẩm thành công!");
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên sản phẩm <span className="text-red-500">*</span></label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="VD: Tấm pin năng lượng mặt trời 550W"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-bold text-gray-800 block">Hiển thị sản phẩm</label>
            <span className="text-xs text-gray-500">Được hiển thị trên Storefront</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-[var(--primary)]' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between border-t sm:border-t-0 sm:border-l border-gray-200 pt-3 sm:pt-0 sm:pl-4">
          <div>
            <label className="text-sm font-bold text-amber-700 block flex items-center gap-1">
              Gán cờ Bán Chạy (Bestseller)
            </label>
            <span className="text-xs text-gray-500">Ghim vào khối Sản phẩm bán chạy</span>
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, is_bestseller: !prev.is_bestseller }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_bestseller ? 'bg-amber-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_bestseller ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại sản phẩm <span className="text-red-500">*</span></label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          >
            <option value="EQUIPMENT">Thiết bị</option>
            <option value="PACKAGE">Gói lắp đặt</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
          <select
            value={form.category_id}
            onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          >
            <option value="">— Chọn danh mục —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mã SKU</label>
          <input
            type="text"
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
            placeholder="VD: SP-DEYE-8KW"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá nhập (VNĐ)</label>
          <input
            type="number"
            min="0"
            value={form.import_price}
            onChange={(e) => setForm((prev) => ({ ...prev, import_price: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            min="0"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">% Sale</label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.discount_rate}
            onChange={(e) => setForm((prev) => ({ ...prev, discount_rate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tồn kho</label>
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Thời gian dự kiến có hàng (Nếu hết hàng)
        </label>
        <input
          type="date"
          value={form.restock_date}
          onChange={(e) => setForm((prev) => ({ ...prev, restock_date: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          Hiển thị cho khách hàng trên Storefront khi số lượng Tồn kho = 0.
        </p>
      </div>

      {/* Thông tin thương mại */}
      <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Thông tin thương mại</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Thương hiệu</label>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              placeholder="VD: Deye, Huawei"
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Xuất xứ</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))}
              placeholder="VD: Trung Quốc, Đức"
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Bảo hành</label>
            <input
              type="text"
              value={form.warranty_info}
              onChange={(e) => setForm((prev) => ({ ...prev, warranty_info: e.target.value }))}
              placeholder="VD: 5 năm, 12 tháng"
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nhà cung cấp</label>
            <input
              type="text"
              value={form.supplier}
              onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
              placeholder="VD: Nexera Official"
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh chính</label>
        <ImageUpload
          value={form.image_url}
          onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          folder="products"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh phụ (Gallery)</label>
        <MultiImageUpload
          value={form.gallery}
          onChange={(urls) => setForm((prev) => ({ ...prev, gallery: urls }))}
          folder="products_gallery"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Thông số kỹ thuật</label>
        <p className="text-xs text-gray-400 mb-2">Nhập từng thông số theo dạng Tên — Giá trị. Nhấn Tab từ ô giá trị cuối để thêm dòng mới.</p>
        <SpecificationsEditor
          value={form.specifications}
          onChange={(specs) => setForm((prev) => ({ ...prev, specifications: specs }))}
        />
      </div>

      <div className="mb-8 pb-8">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả sản phẩm</label>
        <div className="bg-white rounded-lg border border-gray-200">
          <ReactQuill
            theme="snow"
            value={form.description}
            onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
            className="h-[250px] mb-12"
          />
        </div>
      </div>

      {/* SEO Section */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-semibold text-blue-700">SEO &amp; Tìm kiếm</span>
          <span className="text-xs text-blue-400">(tùy chọn)</span>
        </div>

        {/* Google Search Preview */}
        <div className="bg-white rounded-lg border border-blue-100 p-3">
          <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Preview kết quả Google</p>
          <div className="text-blue-600 text-base font-medium leading-tight line-clamp-1">
            {form.meta_title || form.name || "Tên sản phẩm"}
          </div>
          <div className="text-green-700 text-xs mt-0.5">
            nexera.vn/san-pham/{form.slug || "slug-san-pham"}
          </div>
          <div className="text-gray-600 text-sm mt-1 line-clamp-2 leading-snug">
            {form.meta_description ||
              (form.description
                ? form.description.replace(/<[^>]+>/g, "").slice(0, 160)
                : "Mô tả sản phẩm sẽ xuất hiện ở đây...")}
          </div>
        </div>

        {/* Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Meta Title</label>
            <span className={`text-xs font-medium ${
              form.meta_title.length > 70 ? "text-red-500" :
              form.meta_title.length > 55 ? "text-amber-500" : "text-gray-400"
            }`}>
              {form.meta_title.length}/70
            </span>
          </div>
          <input
            type="text"
            maxLength={70}
            value={form.meta_title}
            onChange={(e) => setForm((prev) => ({ ...prev, meta_title: e.target.value }))}
            placeholder={form.name || "Nhập tiêu đề SEO (mặc định dùng tên sản phẩm)"}
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/30 focus:border-blue-400 transition-all text-sm bg-white"
          />
          <p className="text-xs text-gray-400 mt-1">Lý tưởng: 50–60 ký tự. Nếu để trống, tự động dùng tên sản phẩm.</p>
        </div>

        {/* Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Meta Description</label>
            <span className={`text-xs font-medium ${
              form.meta_description.length > 160 ? "text-red-500" :
              form.meta_description.length > 140 ? "text-amber-500" : "text-gray-400"
            }`}>
              {form.meta_description.length}/160
            </span>
          </div>
          <textarea
            maxLength={160}
            rows={3}
            value={form.meta_description}
            onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
            placeholder="Mô tả ngắn gọn xuất hiện trên Google (mặc định dùng đầu mô tả sản phẩm)"
            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/30 focus:border-blue-400 transition-all text-sm bg-white resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Lý tưởng: 120–160 ký tự. Nếu để trống, tự động dùng 160 ký tự đầu của mô tả.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Đang lưu..." : "Lưu lại"}
        </button>
      </div>
    </form>
  );
}
