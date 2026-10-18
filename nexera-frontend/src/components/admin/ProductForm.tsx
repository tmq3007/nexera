"use client";

import { useState } from "react";
import { ChevronDown, Loader2, Save } from "lucide-react";
import { productsApi } from "@/lib/api/products.api";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { MultiImageUpload } from "@/components/ui/MultiImageUpload";
import { SpecificationsEditor } from "@/components/ui/SpecificationsEditor";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { logActivity } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/messages";
import { ProductClassificationFields } from "./ProductClassificationFields";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

function Section({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200/80 bg-white">
      <header className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/60 rounded-t-xl">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[11px] font-bold">
          {step}
        </span>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {hint && <span className="text-xs text-gray-400 ml-auto hidden sm:inline">{hint}</span>}
      </header>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  activeCls = "bg-[var(--primary)]",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  activeCls?: string;
}) {
  return (
    <button type="button" onClick={onChange} className="inline-flex items-center gap-2 group" aria-pressed={checked}>
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? activeCls : "bg-gray-300"}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
      </span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </button>
  );
}

export function ProductForm({ initialData, categories, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [showSeo, setShowSeo] = useState(Boolean(initialData?.meta_title || initialData?.meta_description));
  const toast = useToast();
  const { accessToken } = useAuth();

  const [form, setForm] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    category_id: initialData?.category_id || "",
    brand_id: initialData?.brand_id || "",
    product_type_id: initialData?.product_type_id || "",
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
    sale_mode: initialData?.sale_mode || "inherit",
    price_display: initialData?.price_display || "show",
  });

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

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

  // Tính toán hiển thị nhanh
  const priceNum = Number(form.price) || 0;
  const importNum = Number(form.import_price) || 0;
  const discountNum = Number(form.discount_rate) || 0;
  const salePriceNum = priceNum * (1 - discountNum / 100);
  const profitNum = importNum > 0 ? salePriceNum - importNum : null;
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n));

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
      brand_id: form.brand_id || null,
      product_type_id: form.product_type_id || null,
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
      // Giữ brand text cũ nếu chưa chọn thương hiệu (backend tự ghi đè theo tên hãng khi có brand_id)
      brand: form.brand || null,
      sku: form.sku || null,
      origin: form.origin || null,
      warranty_info: form.warranty_info || null,
      supplier: form.supplier || null,
      sale_mode: form.sale_mode,
      price_display: form.price_display,
    };

    let result;
    try {
      if (initialData?.id) {
        // Update
        result = await productsApi.updateProduct(initialData.id, dataToSave, accessToken!);
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
        result = await productsApi.createProduct(dataToSave, accessToken!);
        if (result) {
          logActivity({
            action: "CREATE_PRODUCT",
            entity_type: "products",
            entity_id: result?.id,
            details: { product_name: form.name, data: dataToSave },
          });
        }
      }
    } catch (err) {
      setLoading(false);
      toast.error(formatErrorMessage(err, "Lỗi khi lưu sản phẩm"));
      return;
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Thông tin cơ bản */}
      <Section step={1} title="Thông tin cơ bản">
        <div>
          <label htmlFor="pf-name" className={labelCls}>Tên sản phẩm <span className="text-red-500">*</span></label>
          <input
            id="pf-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="VD: Xe điện Vinsky Blus (trắng xanh)"
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="pf-slug" className={labelCls}>Slug (URL) <span className="text-gray-400 font-normal">· tự sinh từ tên</span></label>
            <input
              id="pf-slug"
              type="text"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={`${inputCls} bg-gray-50 text-gray-500 font-mono text-xs`}
            />
          </div>
          <div>
            <label htmlFor="pf-sku" className={labelCls}>Mã SKU</label>
            <input
              id="pf-sku"
              type="text"
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              placeholder="VD: VS-BLUS-TX"
              className={inputCls}
            />
          </div>
        </div>
      </Section>

      {/* 2. Phân loại */}
      <Section step={2} title="Phân loại" hint="Chọn hãng trước, sau đó chọn loại của hãng">
        <ProductClassificationFields
          categories={categories}
          legacyBrandName={form.brand}
          value={{ category_id: form.category_id, brand_id: form.brand_id, product_type_id: form.product_type_id }}
          onChange={(patch) =>
            setForm((prev) => ({
              ...prev,
              ...patch,
              // Bỏ chọn hãng -> xóa luôn tên hãng dạng text cũ
              ...(patch.brand_id === "" ? { brand: "" } : {}),
            }))
          }
          layout="grid"
        />
      </Section>

      {/* 3. Giá & Kho */}
      <Section step={3} title="Giá & Tồn kho">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="pf-import" className={labelCls}>Giá nhập (₫)</label>
            <input id="pf-import" type="number" min="0" value={form.import_price}
              onChange={(e) => set("import_price", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-price" className={labelCls}>Giá bán (₫) <span className="text-red-500">*</span></label>
            <input id="pf-price" type="number" required min="0" value={form.price}
              onChange={(e) => set("price", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-discount" className={labelCls}>Giảm giá (%)</label>
            <input id="pf-discount" type="number" min="0" max="100" value={form.discount_rate}
              onChange={(e) => set("discount_rate", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-stock" className={labelCls}>Tồn kho</label>
            <input id="pf-stock" type="number" min="0" value={form.stock}
              onChange={(e) => set("stock", e.target.value)} className={inputCls} />
          </div>
        </div>

        {priceNum > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-gray-500">Giá sau giảm: <b className="text-gray-900">{fmt(salePriceNum)} ₫</b></span>
            {profitNum !== null && (
              <span className="text-gray-500">
                Lãi dự kiến:{" "}
                <b className={profitNum < 0 ? "text-rose-600" : "text-emerald-600"}>
                  {fmt(profitNum)} ₫{salePriceNum > 0 && ` (${((profitNum / salePriceNum) * 100).toFixed(1)}%)`}
                </b>
              </span>
            )}
          </div>
        )}

        <div className="md:w-1/2">
          <label htmlFor="pf-restock" className={labelCls}>Ngày dự kiến có hàng lại</label>
          <input id="pf-restock" type="date" value={form.restock_date}
            onChange={(e) => set("restock_date", e.target.value)} className={inputCls} />
          <p className="text-xs text-gray-400 mt-1">Hiển thị cho khách khi tồn kho = 0.</p>
        </div>

        {/* Chế độ bán lẻ & Hiển thị giá */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <label htmlFor="pf-sale-mode" className={labelCls}>
              Chế độ bán hàng (Ecommerce / Tư vấn)
            </label>
            <select
              id="pf-sale-mode"
              value={form.sale_mode}
              onChange={(e) => set("sale_mode", e.target.value as any)}
              className={inputCls}
            >
              <option value="inherit">Theo cài đặt chung toàn website (Mặc định)</option>
              <option value="buyable">Luôn cho mua online (Bỏ qua cài đặt chung)</option>
              <option value="consult_only">Chỉ nhận tư vấn &amp; báo giá (Ẩn nút mua)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              &quot;Chỉ nhận tư vấn&quot; sẽ ẩn nút Thêm giỏ / Mua ngay và chỉ hiện nút &quot;Nhận Tư Vấn Ngay&quot;.
            </p>
          </div>

          <div>
            <label htmlFor="pf-price-display" className={labelCls}>
              Cách hiển thị giá trên website
            </label>
            <select
              id="pf-price-display"
              value={form.price_display}
              onChange={(e) => set("price_display", e.target.value as any)}
              className={inputCls}
            >
              <option value="show">Hiển thị giá bán số (Mặc định)</option>
              <option value="contact">Hiển thị chữ &quot;Liên hệ báo giá&quot;</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Chọn &quot;Liên hệ báo giá&quot; để ẩn con số giá bán cụ thể trên website.
            </p>
          </div>
        </div>
      </Section>

      {/* 4. Hình ảnh */}
      <Section step={4} title="Hình ảnh">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Ảnh chính</label>
            <ImageUpload value={form.image_url} onChange={(url) => set("image_url", url)} folder="products" />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Ảnh phụ (Gallery)</label>
            <MultiImageUpload value={form.gallery} onChange={(urls) => set("gallery", urls)} folder="products_gallery" />
          </div>
        </div>
      </Section>

      {/* 5. Mô tả & Thông số */}
      <Section step={5} title="Mô tả & Thông số kỹ thuật">
        <div>
          <label className={labelCls}>Thông số kỹ thuật</label>
          <p className="text-xs text-gray-400 mb-2">Nhập từng thông số theo dạng Tên — Giá trị. Nhấn Tab từ ô giá trị cuối để thêm dòng mới.</p>
          <SpecificationsEditor value={form.specifications} onChange={(specs) => set("specifications", specs)} />
        </div>
        <div className="pb-10">
          <label className={labelCls}>Mô tả sản phẩm</label>
          <div className="bg-white rounded-lg border border-gray-200">
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(val) => set("description", val)}
              className="h-[250px] mb-12"
            />
          </div>
        </div>
      </Section>

      {/* 6. Thông tin thêm */}
      <Section step={6} title="Thông tin thêm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="pf-origin" className={labelCls}>Xuất xứ</label>
            <input id="pf-origin" type="text" value={form.origin} onChange={(e) => set("origin", e.target.value)}
              placeholder="VD: Việt Nam, Trung Quốc" className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-warranty" className={labelCls}>Bảo hành</label>
            <input id="pf-warranty" type="text" value={form.warranty_info} onChange={(e) => set("warranty_info", e.target.value)}
              placeholder="VD: 3 năm, 12 tháng" className={inputCls} />
          </div>
          <div>
            <label htmlFor="pf-supplier" className={labelCls}>Nhà cung cấp</label>
            <input id="pf-supplier" type="text" value={form.supplier} onChange={(e) => set("supplier", e.target.value)}
              placeholder="VD: Nexera Official" className={inputCls} />
          </div>
        </div>
      </Section>

      {/* 7. SEO (thu gọn) */}
      <section className="rounded-xl border border-gray-200/80 bg-white">
        <button
          type="button"
          onClick={() => setShowSeo((v) => !v)}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
          aria-expanded={showSeo}
        >
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-300 text-white text-[11px] font-bold">7</span>
          <span className="text-sm font-bold text-gray-800">SEO</span>
          <span className="text-xs text-gray-400">(không bắt buộc)</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto transition-transform ${showSeo ? "rotate-180" : ""}`} />
        </button>
        {showSeo && (
          <div className="p-4 pt-0 space-y-4">
            <div>
              <label htmlFor="pf-meta-title" className={labelCls}>Tiêu đề SEO</label>
              <input id="pf-meta-title" type="text" value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)}
                placeholder={form.name || "Mặc định dùng tên sản phẩm"} className={inputCls} />
            </div>
            <div>
              <label htmlFor="pf-meta-desc" className={labelCls}>Mô tả SEO</label>
              <textarea id="pf-meta-desc" rows={2} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)}
                className={inputCls} />
            </div>
          </div>
        )}
      </section>

      {/* Footer cố định */}
      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-white/95 backdrop-blur border-t border-gray-200 flex flex-wrap items-center gap-x-5 gap-y-2 z-10">
        <Toggle checked={form.is_active} onChange={() => set("is_active", !form.is_active)} label="Hiển thị" />
        <Toggle checked={form.is_bestseller} onChange={() => set("is_bestseller", !form.is_bestseller)} label="Bán chạy" activeCls="bg-amber-500" />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Đang lưu..." : "Lưu lại"}
          </button>
        </div>
      </div>
    </form>
  );
}
