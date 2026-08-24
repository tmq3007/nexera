import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/utils/supabase/server";
import { ProductCatalog } from "@/components/storefront/ProductCatalog";
import { Suspense } from "react";

export default async function ProductsPage() {
  const supabase = await createClient();

  // Lấy toàn bộ danh mục và sản phẩm
  const { data: categories } = await supabase.from("categories").select("*");
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Thiết Bị & Gói Lắp Đặt" breadcrumb="Sản phẩm" />

      <section className="py-16 bg-[#F0F7FB] min-h-[600px]">
        <div className="container mx-auto px-4">
           {/* Bọc trong Suspense vì dùng useSearchParams bên trong ProductCatalog */}
           <Suspense fallback={<div className="text-center py-20">Đang tải sản phẩm...</div>}>
             <ProductCatalog initialProducts={products || []} categories={categories || []} />
           </Suspense>
        </div>
      </section>
    </>
  );
}
