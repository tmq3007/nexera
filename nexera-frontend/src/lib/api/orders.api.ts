import { BACKEND_URL } from "./config";

export interface OrderItem {
  id?: string;
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
  unit_price?: number;
  total_price?: number;
  products?: {
    id: string;
    name: string;
    image_url?: string;
    slug?: string;
  };
}

export interface CreateOrderPayload {
  authUserId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  note?: string;
  paymentMethod?: 'PAYOS' | 'COD' | 'BANK_TRANSFER';
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface OrderRecord {
  id: string;
  customer_id?: string | null;
  total_amount: number;
  status: 'PENDING' | 'PAID' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  payment_method: string;
  payos_order_code?: string;
  note?: string;
  created_at: string;
  customers?: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  order_items?: OrderItem[];
}

export interface GetOrdersResponse {
  data: OrderRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ordersApi = {
  /**
   * Tạo đơn hàng mới
   */
  async createOrder(payload: CreateOrderPayload): Promise<{
    success: boolean;
    order?: OrderRecord;
    orderCode?: number;
    totalAmount?: number;
    checkoutUrl?: string | null;
    qrCode?: string | null;
  }> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Tạo đơn hàng thất bại.");
      }
      return await res.json();
    } catch (err: any) {
      console.error("Lỗi createOrder:", err);
      return { success: false };
    }
  },

  /**
   * Lấy danh sách đơn hàng của khách hàng hiện tại
   */
  async getMyOrders(authUserId?: string, customerId?: string): Promise<OrderRecord[]> {
    try {
      const params = new URLSearchParams();
      if (authUserId) params.set("authUserId", authUserId);
      if (customerId) params.set("customerId", customerId);

      const res = await fetch(`${BACKEND_URL}/orders/my-orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getMyOrders:", err);
      return [];
    }
  },

  /**
   * Tra cứu đơn hàng theo mã đơn
   */
  async getOrderLookup(code: string): Promise<OrderRecord | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/lookup/${code}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getOrderLookup:", err);
      return null;
    }
  },

  /**
   * Admin: Danh sách đơn hàng
   */
  async getAdminOrders(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<GetOrdersResponse> {
    try {
      const params = new URLSearchParams();
      if (query.status) params.set("status", query.status);
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", query.page.toString());
      if (query.limit) params.set("limit", query.limit.toString());

      const res = await fetch(`${BACKEND_URL}/orders/admin/list?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      return await res.json();
    } catch (err) {
      console.error("Lỗi getAdminOrders:", err);
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  },

  /**
   * Admin: Cập nhật trạng thái đơn hàng
   */
  async updateStatus(id: string, status: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi updateStatus:", err);
      return false;
    }
  },

  /**
   * Admin: Xóa đơn hàng
   */
  async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi deleteOrder:", err);
      return false;
    }
  },

  /**
   * Admin: Cập nhật / xóa hàng loạt
   */
  async bulkUpdate(payload: {
    ids: string[];
    status?: string;
    action?: 'delete' | 'update_status';
  }): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi bulkUpdate orders:", err);
      return false;
    }
  },
};
