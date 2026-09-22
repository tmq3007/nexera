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
  @IsBoolean()
  bestseller?: boolean;

  @IsOptional()
  @IsString()
  type?: string; // 'EQUIPMENT' | 'PACKAGE'

  @IsOptional()
  page?: number | string;

  @IsOptional()
  limit?: number | string;

  @IsOptional()
  @IsString()
  sort?: string; // 'price_asc' | 'price_desc' | 'newest' | 'oldest'
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
}

export class UpdateProductDto extends CreateProductDto {}

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

export class UpdateCategoryDto extends CreateCategoryDto {}
