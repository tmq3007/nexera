import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  bestseller?: boolean | string;

  @IsOptional()
  @IsString()
  type?: string; // 'EQUIPMENT' | 'PACKAGE'

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  isActive?: boolean | string;

  @IsOptional()
  is_active?: boolean | string;

  @IsOptional()
  @IsString()
  stock?: string;

  @IsOptional()
  price_min?: number | string;

  @IsOptional()
  price_max?: number | string;

  @IsOptional()
  priceMin?: number | string;

  @IsOptional()
  priceMax?: number | string;

  /** Lọc theo Thương hiệu (brands.id) */
  @IsOptional()
  @IsString()
  brand_id?: string;

  /** Lọc theo Loại sản phẩm (product_types.id), 'none' = chưa có loại */
  @IsOptional()
  @IsString()
  product_type_id?: string;

  /** 'true' = gom sản phẩm cùng Hãng -> cùng Loại đứng liền nhau (dùng cho Admin) */
  @IsOptional()
  group_by_type?: boolean | string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  importPrice?: number;

  @IsOptional()
  @IsNumber()
  import_price?: number;

  @IsOptional()
  @IsNumber()
  discountRate?: number;

  @IsOptional()
  @IsNumber()
  discount_rate?: number;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  gallery?: string[];

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  warrantyInfo?: string;

  @IsOptional()
  @IsString()
  warranty_info?: string;

  @IsOptional()
  specifications?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestseller?: boolean;

  @IsOptional()
  @IsBoolean()
  is_bestseller?: boolean;

  @IsOptional()
  @IsString()
  restock_date?: string;

  @IsOptional()
  @IsString()
  meta_title?: string;

  @IsOptional()
  @IsString()
  meta_description?: string;

  /** Thương hiệu (brands.id). Gửi null để gỡ. */
  @IsOptional()
  @IsString()
  brand_id?: string | null;

  /** Loại sản phẩm (product_types.id). Gửi null để gỡ. */
  @IsOptional()
  @IsString()
  product_type_id?: string | null;
}

export class UpdateProductDto extends CreateProductDto { }

export class BulkUpdateProductsDto {
  @IsArray()
  ids: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestseller?: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  action?: 'delete' | 'update_category' | 'update_status' | 'update_bestseller';
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto { }

export class CreateBrandDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class CreateProductTypeDto {
  @IsString()
  brand_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}

export class UpdateProductTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  sort_order?: number;
}
