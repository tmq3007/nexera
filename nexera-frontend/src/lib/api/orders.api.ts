import { BACKEND_URL } from "./config";

// ==========================================
// Enums & Types
// ==========================================

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED'
  | 'RETURNED';

export type PaymentMethod = 'BANK_TRANSFER' | 'COD';
export type PaymentStatusType = 'UNPAID' | 'PAID' | 'REFUNDED';

// Nút hành động theo trạng thái hiện tại
export const STATUS_ACTIONS: Record<OrderStatus, { label: string; nextStatus: OrderStatus; color: string } | null> = {
  PENDING_PAYMENT: { label: 'Xác nhận Đã TT', nextStatus: 'CONFIRMED', color: 'bg-blue-600 hover:bg-blue-700' },
  CONFIRMED: { label: 'Xử lý đơn', nextStatus: 'PROCESSING', color: 'bg-blue-600 hover:bg-blue-700' },
  PROCESSING: { label: 'Giao hàng', nextStatus: 'SHIPPED', color: 'bg-purple-600 hover:bg-purple-700' },
  SHIPPED: { label: 'Đã giao', nextStatus: 'DELIVERED', color: 'bg-emerald-600 hover:bg-emerald-700' },
  DELIVERED: { label: 'Hoàn tất', nextStatus: 'COMPLETED', color: 'bg-green-600 hover:bg-green-700' },
  COMPLETED: null,
  CANCELLED: null,
  REFUND_REQUESTED: { label: 'Duyệt hoàn tiền', nextStatus: 'REFUNDED', color: 'bg-orange-600 hover:bg-orange-700' },
  REFUNDED: null,
  RETURNED: { label: 'Xác nhận hủy', nextStatus: 'CANCELLED', color: 'bg-red-600 hover:bg-red-700' },
};

// Trạng thái có thể hủy
export const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING_PAYMENT', 'CONFIRMED', 'PROCESSING'];

export interface OrderItem {
  id?: string;
  productId?: string;
  product_id?: string;
  product_name?: string;
  product_image?: string;
  product_sku?: string;
  quantity: number;
  unit_price?: number;
  discount_rate?: number;
  total_price?: number;
  products?: {
    id: string;
    name: string;
    image_url?: string;
    slug?: string;
  };
}

export interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  note: string | null;
  created_at: string;
}

export interface OrderRecord {
  id: string;
  order_code?: string;
  customer_id?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_ward?: string;
  shipping_district?: string;
  shipping_province?: string;
  subtotal?: number;
  shipping_fee?: number;
  discount_amount?: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status?: PaymentStatusType;
  paid_at?: string;
  status: OrderStatus;
  shipping_carrier?: string;
  tracking_number?: string;
  shipped_at?: string;
  delivered_at?: string;
  note?: string;
  admin_note?: string;
  cancel_reason?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at?: string;
  payos_order_code?: string;
  order_items?: OrderItem[];
  statusHistory?: StatusHistoryEntry[];
}

export interface GetOrdersResponse {
  data: OrderRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CheckoutPayload {
  authUserId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingProvince: string;
  shippingDistrict: string;
  shippingWard: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
}

// ==========================================
// API Functions
// ==========================================

export const ordersApi = {
  /**
   * Checkout: Tạo đơn hàng mới
   */
  async checkout(payload: CheckoutPayload): Promise<{
    success: boolean;
    order?: { id: string; orderCode: string; status: string; totalAmount: number; paymentMethod: string };
    checkoutUrl?: string | null;
    qrCode?: string | null;
    message?: string;
  }> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/checkout`, {
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
      console.error("Lỗi checkout:", err);
      return { success: false, message: err.message };
    }
  },

  /**
   * Poll trạng thái thanh toán (cho trang kết quả)
   */
  async getPaymentStatus(orderId: string): Promise<OrderRecord | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/${orderId}/payment-status`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Khách xem đơn hàng của mình
   */
  async getMyOrders(authUserId: string): Promise<OrderRecord[]> {
    try {
      const params = new URLSearchParams({ authUserId });
      const res = await fetch(`${BACKEND_URL}/orders/my-orders?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Khách hủy đơn hàng
   */
  async cancelOrder(orderId: string, authUserId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authUserId }),
      });
      return res.ok;
    } catch {
      return false;
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
    } catch {
      return null;
    }
  },

  // ==========================================
  // ADMIN APIs
  // ==========================================

  /**
   * Admin: Danh sách đơn hàng (filter, pagination, search)
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
      if (!res.ok) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      return await res.json();
    } catch {
      return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  },

  /**
   * Admin: Chi tiết đơn hàng (kèm lịch sử trạng thái)
   */
  async getAdminOrderDetail(id: string): Promise<OrderRecord | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Admin: Đổi trạng thái đơn hàng
   */
  async updateStatus(id: string, status: string, note?: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Admin: Cập nhật thông tin vận chuyển
   */
  async updateShipping(id: string, data: { shippingCarrier?: string; trackingNumber?: string }): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}/shipping`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Admin: Xóa đơn hàng
   */
  async deleteOrder(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/orders/admin/${id}`, { method: "DELETE" });
      return res.ok;
    } catch {
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
    } catch {
      return false;
    }
  },
};
