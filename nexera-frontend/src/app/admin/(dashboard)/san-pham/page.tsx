export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { ProductManager } from "@/components/admin/ProductManager";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const q          = typeof params?.q          === 'string' ? params.q          : "";
  const page       = typeof params?.page       === 'string' ? parseInt(params.page, 10) : 1;
  const limit      = typeof params?.limit      === 'string' ? parseInt(params.limit, 10) : 10;
  const isActive   = typeof params?.is_active   === 'string' ? params.is_active   : "";
  const isBestseller = typeof params?.is_bestseller === 'string' ? params.is_bestseller : "";
  const type       = typeof params?.type       === 'string' ? params.type       : "";
  const stock      = typeof params?.stock      === 'string' ? params.stock      : "";
  const categoryId = typeof params?.category_id === 'string' ? params.category_id : "";

  // Nhóm 3: Filter giá & sort
  const priceMin  = typeof params?.price_min === 'string' ? parseFloat(params.price_min) : null;
  const priceMax  = typeof params?.price_max === 'string' ? parseFloat(params.price_max) : null;
  // sort_by format: "column|direction" (vd: "price|asc", "created_at|desc")
  const sortParam = typeof params?.sort_by === 'string' ? params.sort_by : "created_at|desc";
  const [sortColRaw, sortDirRaw] = sortParam.includes('|') ? sortParam.split('|') : [sortParam, 'desc'];

  // Whitelist để tránh SQL injection trên tên cột
  const allowedSortColumns = ["created_at", "price", "stock", "name"];
  const safeSortBy = allowedSortColumns.includes(sortColRaw) ? sortColRaw : "created_at";
  const ascending  = sortDirRaw === "asc";

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  let productsQuery = supabase
    .from("products")
    .select("*, categories(name)", { count: "exact" })
    .order(safeSortBy, { ascending })
    // Tiebreaker để pagination ổn định
    .order("id", { ascending: false })
    .range(from, to);

  if (q)            productsQuery = productsQuery.ilike("name", `%${q}%`);
  if (isActive === "true")       productsQuery = productsQuery.eq("is_active", true);
  if (isActive === "false")      productsQuery = productsQuery.eq("is_active", false);
  if (isBestseller === "true")   productsQuery = productsQuery.eq("is_bestseller", true);
  if (isBestseller === "false")  productsQuery = productsQuery.eq("is_bestseller", false);
  if (type)         productsQuery = productsQuery.eq("type", type);
  if (categoryId)   productsQuery = productsQuery.eq("category_id", categoryId);
  if (stock === "in_stock")      productsQuery = productsQuery.gt("stock", 0);
  if (stock === "out_of_stock")  productsQuery = productsQuery.eq("stock", 0);
  if (priceMin !== null && !isNaN(priceMin)) productsQuery = productsQuery.gte("price", priceMin);
  if (priceMax !== null && !isNaN(priceMax)) productsQuery = productsQuery.lte("price", priceMax);

  const [
    { data: products, count },
    { data: categories }
  ] = await Promise.all([
    productsQuery,
    supabase.from("categories").select("id, name").order("name")
  ]);

  return (
    <ProductManager 
      products={products || []} 
      categories={categories || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
