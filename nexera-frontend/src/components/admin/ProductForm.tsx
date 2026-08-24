"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, categories, onSuccess, onCancel }: ProductFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    category_id: initialData?.category_id || "",
    type: initialData?.type || "EQUIPMENT",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    description: initialData?.description || "",
    image_url: initialData?.image_url || "",
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

    const dataToSave = {
      name: form.name,
      slug: form.slug,
      category_id: form.category_id || null,
      type: form.type,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      description: form.description || null,
      image_url: form.image_url || null,
    };

    let error;

    if (initialData?.id) {
      // Update
      const result = await supabase.from("products").update(dataToSave).eq("id", initialData.id);
      error = result.error;
    } else {
      // Insert
      const result = await supabase.from("products").insert(dataToSave);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng tồn kho</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hình ảnh sản phẩm</label>
        <ImageUpload
          value={form.image_url}
          onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          folder="products"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả sản phẩm</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all resize-none"
        />
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
