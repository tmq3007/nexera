export const dynamic = 'force-dynamic';
import { ProductManager } from "@/components/admin/ProductManager";
import { productsApi } from "@/lib/api/products.api";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q            = typeof params?.q            === 'string' ? params.q            : "";
  const page         = typeof params?.page         === 'string' ? parseInt(params.page, 10) : 1;
  const limit        = typeof params?.limit        === 'string' ? parseInt(params.limit, 10) : 10;
  const isBestseller = typeof params?.is_bestseller === 'string' ? params.is_bestseller : "";
  const isActive     = typeof params?.is_active    === 'string' ? params.is_active    : "";
  const stock        = typeof params?.stock        === 'string' ? params.stock        : "";
  const priceMin     = typeof params?.price_min    === 'string' ? params.price_min    : "";
  const priceMax     = typeof params?.price_max    === 'string' ? params.price_max    : "";
  const sortBy       = typeof params?.sort_by      === 'string' ? params.sort_by      : "";
  const sort         = typeof params?.sort         === 'string' ? params.sort         : "";
  const type         = typeof params?.type         === 'string' ? params.type         : "";
  const categoryId   = typeof params?.category_id  === 'string' ? params.category_id  : "";
  const brandId      = typeof params?.brand_id     === 'string' ? params.brand_id     : "";
  const productTypeId = typeof params?.product_type_id === 'string' ? params.product_type_id : "";
  // Mặc định gom nhóm theo Hãng -> Loại; ?group=0 để xem danh sách phẳng
  const groupByType  = params?.group !== '0';

  const [productsRes, categories, brands, productTypes] = await Promise.all([
    productsApi.getProducts({
      search: q || undefined,
      categoryId: categoryId || undefined,
      type: type || undefined,
      bestseller: isBestseller === "true" ? true : (isBestseller === "false" ? false : undefined),
      is_active: isActive === "true" ? true : (isActive === "false" ? false : undefined),
      stock: stock || undefined,
      price_min: priceMin || undefined,
      price_max: priceMax || undefined,
      sort_by: sortBy || sort || undefined,
      brand_id: brandId || undefined,
      product_type_id: productTypeId || undefined,
      group_by_type: groupByType ? 'true' : undefined,
      page,
      limit,
    }),
    productsApi.getCategories(),
    productsApi.getBrands().catch(() => []),
    productsApi.getProductTypes().catch(() => []),
  ]);

  return (
    <ProductManager 
      products={(productsRes.data as any) || []} 
      categories={categories || []} 
      brands={brands || []}
      productTypes={productTypes || []}
      groupByType={groupByType}
      totalCount={productsRes.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
