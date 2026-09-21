import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCatalog } from "@/components/storefront/ProductCatalog";
import { Suspense } from "react";
import { productsApi } from "@/lib/api/products.api";

export default async function ProductsPage() {
  const [categories, productsRes] = await Promise.all([
    productsApi.getCategories(),
    productsApi.getProducts({ limit: 100 }),
  ]);

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
