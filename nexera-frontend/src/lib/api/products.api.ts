import { api } from './client';
import type { PaginatedResponse } from '@/types/api';
import type { 
  ProductCategory, 
  ProductItem, 
  ProductBrand,
  ProductTypeItem,
  GetProductsQuery,
  CreateProductDto,
  UpdateProductDto
} from '@/types/models/product';

// Re-export types for backward compatibility
export type { ProductCategory, ProductItem, ProductBrand, ProductTypeItem, GetProductsQuery, CreateProductDto, UpdateProductDto } from '@/types/models/product';
export type { PaginatedResponse as GetProductsResponse } from '@/types/api';

export const productsApi = {
  /**
   * Lấy danh sách danh mục
   */
  getCategories: () =>
    api.get<ProductCategory[]>('/products/categories', { revalidate: false }),

  /**
   * Lấy chi tiết danh mục
   */
  getCategory: (idOrSlug: string) =>
    api.get<ProductCategory | null>(`/products/categories/${idOrSlug}`),

  /**
   * Lấy danh sách sản phẩm (có phân trang & lọc)
   */
  getProducts: (query: GetProductsQuery = {}) =>
    api.get<PaginatedResponse<ProductItem>>('/products', {
      params: query as Record<string, string | number | boolean | undefined>,
      revalidate: false,
    }),

  /**
   * Lấy top sản phẩm bán chạy
   */
  getBestsellers: (limit = 8) =>
    api.get<ProductItem[]>('/products/bestsellers', {
      params: { limit },
      revalidate: 60,
    }),

  /**
   * Lấy chi tiết sản phẩm theo slug hoặc id
   */
  getProductDetail: (slugOrId: string) =>
    api.get<ProductItem | null>(`/products/detail/${slugOrId}`, {
      revalidate: false,
    }),

  /**
   * Admin: Tạo sản phẩm mới
   */
  createProduct: (data: CreateProductDto, token: string) =>
    api.post<ProductItem>('/products/admin', data, { token }),

  /**
   * Admin: Cập nhật sản phẩm
   */
  updateProduct: (id: string, data: UpdateProductDto, token: string) =>
    api.put<ProductItem>(`/products/admin/${id}`, data, { token }),

  /**
   * Admin: Xóa sản phẩm
   */
  deleteProduct: (id: string, token: string) =>
    api.delete<void>(`/products/admin/${id}`, { token }).then(() => true),

  /**
   * Admin: Thao tác hàng loạt
   */
  bulkUpdate: (payload: {
    ids: string[];
    isActive?: boolean;
    isBestseller?: boolean;
    categoryId?: string;
    action?: 'delete' | 'update_category' | 'update_status' | 'update_bestseller';
  }, token: string) =>
    api.patch<void>('/products/admin/bulk', payload, { token }).then(() => true),

  /**
   * Admin: Tạo danh mục
   */
  createCategory: (data: any, token: string) =>
    api.post<ProductCategory>('/products/admin/categories', data, { token }),

  /**
   * Admin: Sửa danh mục
   */
  updateCategory: (id: string, data: any, token: string) =>
    api.put<ProductCategory>(`/products/admin/categories/${id}`, data, { token }),

  /**
   * Admin: Xóa danh mục
   */
  deleteCategory: (id: string, token: string) =>
    api.delete<void>(`/products/admin/categories/${id}`, { token }).then(() => true),

  // ===================== THƯƠNG HIỆU =====================

  /** Danh sách thương hiệu (kèm product_count) */
  getBrands: () =>
    api.get<ProductBrand[]>('/products/brands', { revalidate: false }),

  createBrand: (data: { name: string }, token: string) =>
    api.post<ProductBrand>('/products/admin/brands', data, { token }),

  updateBrand: (id: string, data: { name?: string; sort_order?: number }, token: string) =>
    api.put<ProductBrand>(`/products/admin/brands/${id}`, data, { token }),

  deleteBrand: (id: string, token: string) =>
    api.delete<void>(`/products/admin/brands/${id}`, { token }).then(() => true),

  // ===================== LOẠI (theo thương hiệu) =====================

  /** Danh sách loại; truyền brandId để chỉ lấy loại của 1 hãng */
  getProductTypes: (brandId?: string) =>
    api.get<ProductTypeItem[]>('/products/types', {
      params: { brand_id: brandId },
      revalidate: false,
    }),

  createProductType: (data: { brand_id: string; name: string }, token: string) =>
    api.post<ProductTypeItem>('/products/admin/types', data, { token }),

  updateProductType: (id: string, data: { name?: string; sort_order?: number }, token: string) =>
    api.put<ProductTypeItem>(`/products/admin/types/${id}`, data, { token }),

  deleteProductType: (id: string, token: string) =>
    api.delete<void>(`/products/admin/types/${id}`, { token }).then(() => true),
};
