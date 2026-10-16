export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string;
}

/** Thương hiệu (dùng chung mọi danh mục) */
export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  sort_order?: number;
  product_count?: number;
}

/** Loại sản phẩm — thuộc về 1 Thương hiệu (VD: Vinsky → Vinsky blus) */
export interface ProductTypeItem {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  sort_order?: number;
  product_count?: number;
}

export interface ProductItem {
  id: string;
  category_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  import_price?: number | null;
  discount_rate?: number;
  stock?: number;
  type?: string;
  image_url?: string | null;
  images?: string[];
  sku?: string | null;
  brand?: string | null;
  supplier?: string | null;
  origin?: string | null;
  warranty_info?: string | null;
  specifications?: any;
  is_active?: boolean;
  is_bestseller?: boolean;
  created_at: string;
  updated_at?: string;
  categories?: ProductCategory | null;
  brand_id?: string | null;
  product_type_id?: string | null;
  brands?: Pick<ProductBrand, 'id' | 'name' | 'slug'> | null;
  product_types?: Pick<ProductTypeItem, 'id' | 'name' | 'slug'> | null;
}

export interface GetProductsQuery {
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  bestseller?: boolean | string;
  type?: string;
  page?: number;
  limit?: number;
  sort?: string;
  sort_by?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  is_active?: boolean | string;
  isActive?: boolean | string;
  stock?: string;
  price_min?: number | string;
  price_max?: number | string;
  priceMin?: number | string;
  priceMax?: number | string;
  brand_id?: string;
  product_type_id?: string;
  group_by_type?: boolean | string;
}

export interface CreateProductDto {
  name: string;
  price: number;
  category_id?: string;
  description?: string;
  import_price?: number;
  discount_rate?: number;
  stock?: number;
  type?: string;
  image_url?: string;
  images?: string[];
  sku?: string;
  brand?: string;
  supplier?: string;
  origin?: string;
  warranty_info?: string;
  specifications?: any;
  is_active?: boolean;
  is_bestseller?: boolean;
  brand_id?: string | null;
  product_type_id?: string | null;
  [key: string]: any;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
