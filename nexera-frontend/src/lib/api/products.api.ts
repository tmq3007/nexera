const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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

export interface GetProductsResponse {
  data: ProductItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const productsApi = {
  /**
   * Lấy danh sách danh mục
   */
  async getCategories(): Promise<ProductCategory[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/categories`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getCategories:", err);
      return [];
    }
  },

  /**
   * Lấy chi tiết danh mục
   */
  async getCategory(idOrSlug: string): Promise<ProductCategory | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/categories/${idOrSlug}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getCategory:", err);
      return null;
    }
  },

  /**
   * Lấy danh sách sản phẩm (có phân trang & lọc)
   */
  async getProducts(query: GetProductsQuery = {}): Promise<GetProductsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.categorySlug) params.set("categorySlug", query.categorySlug);
      if (query.categoryId) params.set("categoryId", query.categoryId);
      if (query.search) params.set("search", query.search);
      if (query.bestseller !== undefined) params.set("bestseller", String(query.bestseller));
      if (query.type) params.set("type", query.type);
      if (query.page) params.set("page", query.page.toString());
      if (query.limit) params.set("limit", query.limit.toString());
      if (query.sort) params.set("sort", query.sort);

      const res = await fetch(`${BACKEND_URL}/products?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      return await res.json();
    } catch (err) {
      console.error("Lỗi getProducts:", err);
      return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }
  },

  /**
   * Lấy top sản phẩm bán chạy
   */
  async getBestsellers(limit = 8): Promise<ProductItem[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/bestsellers?limit=${limit}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getBestsellers:", err);
      return [];
    }
  },

  /**
   * Lấy chi tiết sản phẩm theo slug hoặc id
   */
  async getProductDetail(slugOrId: string): Promise<ProductItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/detail/${slugOrId}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getProductDetail:", err);
      return null;
    }
  },

  /**
   * Admin: Tạo sản phẩm mới
   */
  async createProduct(data: any): Promise<ProductItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Create product failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error("Lỗi createProduct:", err);
      return null;
    }
  },

  /**
   * Admin: Cập nhật sản phẩm
   */
  async updateProduct(id: string, data: any): Promise<ProductItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`Update product failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.error("Lỗi updateProduct:", err);
      return null;
    }
  },

  /**
   * Admin: Xóa sản phẩm
   */
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi deleteProduct:", err);
      return false;
    }
  },

  /**
   * Admin: Thao tác hàng loạt
   */
  async bulkUpdate(payload: {
    ids: string[];
    isActive?: boolean;
    isBestseller?: boolean;
    categoryId?: string;
    action?: 'delete' | 'update_category' | 'update_status' | 'update_bestseller';
  }): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi bulkUpdate:", err);
      return false;
    }
  },

  /**
   * Admin: Tạo danh mục
   */
  async createCategory(data: any): Promise<ProductCategory | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi createCategory:", err);
      return null;
    }
  },

  /**
   * Admin: Sửa danh mục
   */
  async updateCategory(id: string, data: any): Promise<ProductCategory | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi updateCategory:", err);
      return null;
    }
  },

  /**
   * Admin: Xóa danh mục
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/products/admin/categories/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi deleteCategory:", err);
      return false;
    }
  },
};
