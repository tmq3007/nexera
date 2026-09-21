export const dynamic = 'force-dynamic';
import { ProductManager } from "@/components/admin/ProductManager";
import { productsApi } from "@/lib/api/products.api";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q          = typeof params?.q          === 'string' ? params.q          : "";
  const page       = typeof params?.page       === 'string' ? parseInt(params.page, 10) : 1;
  const limit      = typeof params?.limit      === 'string' ? parseInt(params.limit, 10) : 10;
  const isBestseller = typeof params?.is_bestseller === 'string' ? params.is_bestseller : "";
  const type       = typeof params?.type       === 'string' ? params.type       : "";
  const categoryId = typeof params?.category_id === 'string' ? params.category_id : "";

  const [productsRes, categories] = await Promise.all([
    productsApi.getProducts({
      search: q || undefined,
      categoryId: categoryId || undefined,
      type: type || undefined,
      bestseller: isBestseller === "true" ? true : (isBestseller === "false" ? false : undefined),
      page,
      limit,
    }),
    productsApi.getCategories(),
  ]);

  return (
    <ProductManager 
      products={(productsRes.data as any) || []} 
      categories={categories || []} 
      totalCount={productsRes.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
