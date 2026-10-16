"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { productsApi } from "@/lib/api/products.api";
import type { ProductBrand, ProductCategory, ProductTypeItem } from "@/types/models/product";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatErrorMessage } from "@/lib/messages";
import { TaxonomyManagerModal, TaxonomyItem } from "./TaxonomyManagerModal";

export interface ClassificationValue {
  category_id: string;
  brand_id: string;
  product_type_id: string;
}

interface ProductClassificationFieldsProps {
  categories: { id: string; name: string; description?: string | null }[];
  value: ClassificationValue;
  onChange: (patch: Partial<ClassificationValue>) => void;
  /** Tên thương hiệu dạng text cũ (sản phẩm chưa có brand_id) để gợi ý */
  legacyBrandName?: string;
  /** Bố cục: "stack" (1 cột, cho sidebar) | "grid" (3 cột, cho modal rộng) */
  layout?: "stack" | "grid";
}

type ModalState = { kind: "category" | "brand" | "type"; mode: "add" | "manage" } | null;

const toSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const selectCls =
  "w-full min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

const iconBtnCls =
  "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 text-gray-500 hover:text-[var(--primary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 transition-colors disabled:opacity-40 disabled:pointer-events-none";

/**
 * Khối "Phân loại" dùng chung cho form Thêm/Sửa sản phẩm.
 * Danh mục (độc lập)  |  Thương hiệu -> Loại (loại thuộc hãng).
 * Mỗi ô có ➕ (thêm nhanh, tự chọn) và ⚙️ (quản lý: đổi tên / xóa).
 */
export function ProductClassificationFields({
  categories: initialCategories,
  value,
  onChange,
  legacyBrandName,
  layout = "grid",
}: ProductClassificationFieldsProps) {
  const { accessToken } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [brands, setBrands] = useState<ProductBrand[]>([]);
  const [types, setTypes] = useState<ProductTypeItem[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => setCategories(initialCategories || []), [initialCategories]);

  const loadBrands = useCallback(async () => {
    try {
      const data = await productsApi.getBrands();
      setBrands(data || []);
    } catch {
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  const loadTypes = useCallback(async (brandId: string) => {
    if (!brandId) {
      setTypes([]);
      return;
    }
    setLoadingTypes(true);
    try {
      const data = await productsApi.getProductTypes(brandId);
      setTypes(data || []);
    } catch {
      setTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    loadTypes(value.brand_id);
  }, [value.brand_id, loadTypes]);

  // Sản phẩm cũ chỉ có brand text -> tự chọn hãng trùng tên (nếu đã có trong danh sách)
  useEffect(() => {
    if (value.brand_id || !legacyBrandName || brands.length === 0) return;
    const match = brands.find((b) => b.slug === toSlug(legacyBrandName));
    if (match) onChange({ brand_id: match.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, legacyBrandName]);

  const selectedBrand = brands.find((b) => b.id === value.brand_id);

  const fail = (err: unknown, fallback: string) => {
    toast.error(formatErrorMessage(err, fallback));
  };

  // ---------- Danh mục ----------
  const categoryHandlers = {
    onCreate: async (name: string): Promise<TaxonomyItem | null> => {
      try {
        const created = await productsApi.createCategory({ name, slug: toSlug(name) }, accessToken!);
        setCategories((prev) => [...prev, created]);
        toast.success(`Đã thêm danh mục "${name}"`);
        return created;
      } catch (err) {
        fail(err, "Không thể thêm danh mục");
        return null;
      }
    },
    onRename: async (id: string, name: string) => {
      const current = categories.find((c) => c.id === id);
      try {
        await productsApi.updateCategory(
          id,
          { name, slug: toSlug(name), description: current?.description ?? undefined },
          accessToken!
        );
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name, slug: toSlug(name) } : c)));
        toast.success("Đã đổi tên danh mục");
        return true;
      } catch (err) {
        fail(err, "Không thể đổi tên danh mục");
        return false;
      }
    },
    onDelete: async (id: string) => {
      try {
        await productsApi.deleteCategory(id, accessToken!);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        if (value.category_id === id) onChange({ category_id: "" });
        toast.success("Đã xóa danh mục");
        return true;
      } catch (err) {
        fail(err, "Không thể xóa danh mục (có thể đang có sản phẩm thuộc danh mục này)");
        return false;
      }
    },
  };

  // ---------- Thương hiệu ----------
  const brandHandlers = {
    onCreate: async (name: string): Promise<TaxonomyItem | null> => {
      try {
        const created = await productsApi.createBrand({ name }, accessToken!);
        setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "vi")));
        toast.success(`Đã thêm thương hiệu "${name}"`);
        return created;
      } catch (err) {
        fail(err, "Không thể thêm thương hiệu");
        return null;
      }
    },
    onRename: async (id: string, name: string) => {
      try {
        await productsApi.updateBrand(id, { name }, accessToken!);
        setBrands((prev) => prev.map((b) => (b.id === id ? { ...b, name, slug: toSlug(name) } : b)));
        toast.success("Đã đổi tên thương hiệu");
        return true;
      } catch (err) {
        fail(err, "Không thể đổi tên thương hiệu");
        return false;
      }
    },
    onDelete: async (id: string) => {
      try {
        await productsApi.deleteBrand(id, accessToken!);
        setBrands((prev) => prev.filter((b) => b.id !== id));
        if (value.brand_id === id) onChange({ brand_id: "", product_type_id: "" });
        toast.success("Đã xóa thương hiệu");
        return true;
      } catch (err) {
        fail(err, "Không thể xóa thương hiệu");
        return false;
      }
    },
  };

  // ---------- Loại ----------
  const typeHandlers = {
    onCreate: async (name: string): Promise<TaxonomyItem | null> => {
      if (!value.brand_id) return null;
      try {
        const created = await productsApi.createProductType({ brand_id: value.brand_id, name }, accessToken!);
        setTypes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "vi")));
        toast.success(`Đã thêm loại "${name}"`);
        return created;
      } catch (err) {
        fail(err, "Không thể thêm loại");
        return null;
      }
    },
    onRename: async (id: string, name: string) => {
      try {
        await productsApi.updateProductType(id, { name }, accessToken!);
        setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, name, slug: toSlug(name) } : t)));
        toast.success("Đã đổi tên loại");
        return true;
      } catch (err) {
        fail(err, "Không thể đổi tên loại");
        return false;
      }
    },
    onDelete: async (id: string) => {
      try {
        await productsApi.deleteProductType(id, accessToken!);
        setTypes((prev) => prev.filter((t) => t.id !== id));
        if (value.product_type_id === id) onChange({ product_type_id: "" });
        toast.success("Đã xóa loại");
        return true;
      } catch (err) {
        fail(err, "Không thể xóa loại");
        return false;
      }
    },
  };

  const wrapperCls = layout === "grid" ? "grid grid-cols-1 md:grid-cols-3 gap-4" : "space-y-4";

  const brandPlaceholder = loadingBrands
    ? "Đang tải..."
    : legacyBrandName && !value.brand_id
      ? `— Chọn (đang ghi: ${legacyBrandName}) —`
      : "— Chọn thương hiệu —";

  const typePlaceholder = !value.brand_id
    ? "Chọn thương hiệu trước"
    : loadingTypes
      ? "Đang tải..."
      : types.length === 0
        ? "Chưa có loại — bấm ➕ để thêm"
        : "— Chọn loại —";

  return (
    <>
      <div className={wrapperCls}>
        {/* Danh mục */}
        <div>
          <label htmlFor="product-category" className="block text-sm font-medium text-gray-700 mb-1.5">
            Danh mục
          </label>
          <div className="flex gap-1.5">
            <select
              id="product-category"
              value={value.category_id}
              onChange={(e) => onChange({ category_id: e.target.value })}
              className={selectCls}
            >
              <option value="">— Chọn danh mục —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="button" className={iconBtnCls} title="Thêm danh mục"
              onClick={() => setModal({ kind: "category", mode: "add" })}>
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" className={iconBtnCls} title="Quản lý danh mục"
              onClick={() => setModal({ kind: "category", mode: "manage" })}>
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thương hiệu */}
        <div>
          <label htmlFor="product-brand" className="block text-sm font-medium text-gray-700 mb-1.5">
            Thương hiệu
          </label>
          <div className="flex gap-1.5">
            <select
              id="product-brand"
              value={value.brand_id}
              disabled={loadingBrands}
              onChange={(e) => onChange({ brand_id: e.target.value, product_type_id: "" })}
              className={selectCls}
            >
              <option value="">{brandPlaceholder}</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button type="button" className={iconBtnCls} title="Thêm thương hiệu"
              onClick={() => setModal({ kind: "brand", mode: "add" })}>
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" className={iconBtnCls} title="Quản lý thương hiệu"
              onClick={() => setModal({ kind: "brand", mode: "manage" })}>
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loại */}
        <div>
          <label htmlFor="product-type" className="block text-sm font-medium text-gray-700 mb-1.5">
            Loại {selectedBrand && <span className="text-gray-400 font-normal">· {selectedBrand.name}</span>}
          </label>
          <div className="flex gap-1.5">
            <select
              id="product-type"
              value={value.product_type_id}
              disabled={!value.brand_id || loadingTypes}
              onChange={(e) => onChange({ product_type_id: e.target.value })}
              className={selectCls}
            >
              <option value="">{typePlaceholder}</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button type="button" className={iconBtnCls} title="Thêm loại" disabled={!value.brand_id}
              onClick={() => setModal({ kind: "type", mode: "add" })}>
              <Plus className="w-4 h-4" />
            </button>
            <button type="button" className={iconBtnCls} title="Quản lý loại" disabled={!value.brand_id}
              onClick={() => setModal({ kind: "type", mode: "manage" })}>
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Popups */}
      <TaxonomyManagerModal
        isOpen={modal?.kind === "category"}
        mode={modal?.mode ?? "add"}
        onClose={() => setModal(null)}
        entityLabel="danh mục"
        placeholder="VD: Xe điện, Pin lưu trữ..."
        items={categories}
        selectedId={value.category_id}
        onSelect={(item) => onChange({ category_id: item.id })}
        {...categoryHandlers}
      />
      <TaxonomyManagerModal
        isOpen={modal?.kind === "brand"}
        mode={modal?.mode ?? "add"}
        onClose={() => setModal(null)}
        entityLabel="thương hiệu"
        placeholder="VD: Vinsky, Chilwee..."
        items={brands}
        selectedId={value.brand_id}
        onSelect={(item) => {
          if (item.id !== value.brand_id) onChange({ brand_id: item.id, product_type_id: "" });
        }}
        deleteHint="Các loại của hãng này cũng bị xóa."
        {...brandHandlers}
      />
      <TaxonomyManagerModal
        isOpen={modal?.kind === "type"}
        mode={modal?.mode ?? "add"}
        onClose={() => setModal(null)}
        entityLabel="loại"
        subtitle={selectedBrand ? `Thuộc thương hiệu: ${selectedBrand.name}` : undefined}
        placeholder="VD: Vinsky Blus, IYOKO i9..."
        items={types}
        selectedId={value.product_type_id}
        onSelect={(item) => onChange({ product_type_id: item.id })}
        {...typeHandlers}
      />
    </>
  );
}
