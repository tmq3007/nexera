import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCatalog } from "@/components/storefront/ProductCatalog";
import { Suspense } from "react";
import { productsApi } from "@/lib/api/products.api";
import type { ProductItem } from "@/types/models/product";

const PAGE_SIZE = 100; // Backend giới hạn tối đa 100 sp / lần
const MAX_PAGES = 10;

/** Lấy toàn bộ sản phẩm ĐANG BÁN, đã sắp theo Hãng › Loại */
async function fetchAllActiveProducts(): Promise<ProductItem[]> {
  const query = { limit: PAGE_SIZE, is_active: true, group_by_type: true };
  try {
    const first = await productsApi.getProducts({ ...query, page: 1 });
    const all = [...(first.data || [])];
    const totalPages = Math.min(first.totalPages || 1, MAX_PAGES);
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          productsApi.getProducts({ ...query, page: i + 2 }).catch(() => null),
        ),
      );
      rest.forEach((res) => res?.data && all.push(...res.data));
    }
    return all;
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const [categories, products] = await Promise.all([
    productsApi.getCategories(),
    fetchAllActiveProducts(),
  ]);
  const productsRes = { data: products };

  return (
    <>
      <PageHeader title="Thiết Bị & Gói Lắp Đặt" breadcrumb="Sản phẩm" />

      <section className="py-16 bg-[#F0F7FB] min-h-[600px]">
        <div className="container mx-auto px-4">
           {/* Bọc trong Suspense vì dùng useSearchParams bên trong ProductCatalog */}
           <Suspense fallback={<div className="text-center py-20 text-[#13426E]">Đang tải sản phẩm...</div>}>
             <ProductCatalog initialProducts={productsRes.data || []} categories={categories || []} />
           </Suspense>
        </div>
      </section>
    </>
  );
}
