export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string;
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
}

export interface GetProductsQuery {
  categorySlug?: string;
  categoryId?: string;
  search?: string;
  bestseller?: boolean;
  type?: string;
  page?: number;
  limit?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
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
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}
