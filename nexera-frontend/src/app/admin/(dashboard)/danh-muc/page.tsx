export const dynamic = 'force-dynamic';
import { CategoryManager } from "@/components/admin/CategoryManager";
import { productsApi } from "@/lib/api/products.api";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q.toLowerCase() : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;

  const allCategories = await productsApi.getCategories();
  
  const filtered = q
    ? allCategories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
    : allCategories;

  const from = (page - 1) * limit;
  const paginated = filtered.slice(from, from + limit);

  return (
    <CategoryManager 
      categories={paginated || []} 
      totalCount={filtered.length}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
