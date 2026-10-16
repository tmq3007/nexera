/**
 * Gom sản phẩm storefront theo cụm: Danh mục › Thương hiệu › Loại.
 * Mỗi màu là 1 sản phẩm riêng trong DB → gom các sản phẩm cùng Loại thành 1 "nhóm" (thẻ).
 * Hoạt động cả khi DB chưa chạy migration brands/product_types (dùng cột brand text cũ).
 */

export interface CatalogVariant {
  product: any;
  /** Nhãn biến thể, VD "Đỏ" */
  label: string;
  /** Mã màu nếu nhận diện được từ nhãn */
  color: string | null;
}

export interface ProductGroup {
  key: string;
  isGroup: boolean;
  title: string;
  brandSlug: string | null;
  brandName: string | null;
  typeSlug: string | null;
  variants: CatalogVariant[];
}

export interface BrandNode {
  slug: string;
  name: string;
  count: number;
  types: { slug: string; name: string; count: number }[];
}

export function slugify(input: string): string {
  return (input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Thương hiệu của sản phẩm: ưu tiên bảng brands, sau đó cột brand text cũ */
export function getBrandInfo(p: any): { slug: string; name: string } | null {
  if (p?.brands?.name) {
    return { slug: p.brands.slug || slugify(p.brands.name), name: p.brands.name };
  }
  const text = typeof p?.brand === "string" ? p.brand.trim() : "";
  if (!text) return null;
  return { slug: slugify(text), name: text };
}

export function getTypeInfo(p: any): { id: string; slug: string; name: string } | null {
  if (!p?.product_type_id || !p?.product_types?.name) return null;
  return {
    id: p.product_type_id,
    slug: p.product_types.slug || slugify(p.product_types.name),
    name: p.product_types.name,
  };
}

const COLOR_MAP: [RegExp, string][] = [
  [/xanh\s*(duong|navy|bien|than)/, "#1E40AF"],
  [/xanh\s*(la|reu|luc)/, "#16A34A"],
  [/xanh\s*(ngoc|mint|ngoc bich)/, "#14B8A6"],
  [/xanh\s*(nhat|da troi|sky)/, "#7DD3FC"],
  [/^xanh|\bxanh\b|blue/, "#2563EB"],
  [/\bdo\b|red|man/, "#DC2626"],
  [/trang|white/, "#F8FAFC"],
  [/\bden\b|black/, "#111827"],
  [/xam|ghi|grey|gray|titan/, "#6B7280"],
  [/bac|silver/, "#CBD5E1"],
  [/vang|yellow|gold/, "#EAB308"],
  [/hong|pink/, "#EC4899"],
  [/cam|orange/, "#F97316"],
  [/tim|purple/, "#9333EA"],
  [/nau|brown|cafe/, "#92400E"],
  [/kem|be\b|cream|beige/, "#F5E6C8"],
];

export function colorFromLabel(label: string): string | null {
  const s = slugify(label).replace(/-/g, " ");
  if (!s) return null;
  for (const [re, hex] of COLOR_MAP) {
    if (re.test(s)) return hex;
  }
  return null;
}

/** Lấy nhãn biến thể: phần trong ngoặc cuối tên, hoặc phần tên còn lại sau tên Loại */
export function getVariantLabel(name: string, typeName?: string | null): string {
  const paren = (name || "").match(/\(([^()]+)\)\s*$/);
  if (paren) return paren[1].replace(/^m[àa]u\s+/i, "").trim();
  if (typeName && slugify(name).startsWith(slugify(typeName))) {
    const typeWords = typeName.trim().split(/\s+/).length;
    const rest = name.trim().split(/\s+/).slice(typeWords).join(" ").replace(/^[-–:,\s]+/, "").trim();
    if (rest) return rest;
  }
  return name;
}

/** Gom sản phẩm thành nhóm theo Loại, giữ nguyên thứ tự xuất hiện */
export function buildGroups(products: any[]): ProductGroup[] {
  const groups: ProductGroup[] = [];
  const byType = new Map<string, ProductGroup>();

  for (const p of products) {
    const brand = getBrandInfo(p);
    const type = getTypeInfo(p);
    if (type) {
      let g = byType.get(type.id);
      if (!g) {
        g = {
          key: `type-${type.id}`,
          isGroup: true,
          title: type.name,
          brandSlug: brand?.slug ?? null,
          brandName: brand?.name ?? null,
          typeSlug: type.slug,
          variants: [],
        };
        byType.set(type.id, g);
        groups.push(g);
      }
      const label = getVariantLabel(p.name, type.name);
      g.variants.push({ product: p, label, color: colorFromLabel(label) });
    } else {
      groups.push({
        key: `p-${p.id}`,
        isGroup: false,
        title: p.name,
        brandSlug: brand?.slug ?? null,
        brandName: brand?.name ?? null,
        typeSlug: null,
        variants: [{ product: p, label: p.name, color: null }],
      });
    }
  }
  // Nhóm chỉ có 1 sản phẩm → hiển thị như thẻ đơn (giữ tên đầy đủ)
  for (const g of groups) {
    if (g.isGroup && g.variants.length === 1) {
      g.title = g.variants[0].product.name;
    }
  }
  return groups;
}

/** Cây Thương hiệu › Loại (kèm số lượng) của danh sách sản phẩm */
export function buildBrandTree(products: any[]): BrandNode[] {
  const map = new Map<string, BrandNode & { typeMap: Map<string, { slug: string; name: string; count: number }> }>();
  for (const p of products) {
    const brand = getBrandInfo(p);
    if (!brand) continue;
    let node = map.get(brand.slug);
    if (!node) {
      node = { ...brand, count: 0, types: [], typeMap: new Map() };
      map.set(brand.slug, node);
    }
    node.count++;
    const type = getTypeInfo(p);
    if (type) {
      const t = node.typeMap.get(type.slug) || { slug: type.slug, name: type.name, count: 0 };
      t.count++;
      node.typeMap.set(type.slug, t);
    }
  }
  return Array.from(map.values())
    .map(({ typeMap, ...n }) => ({
      ...n,
      types: Array.from(typeMap.values()).sort((a, b) => a.name.localeCompare(b.name, "vi")),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}
