import { api } from './client';
import type { PaginatedResponse } from '@/types/api';
import type { 
  OrderRecord,
  CheckoutPayload,
  GetOrdersQuery
} from '@/types/models/order';

export * from '@/types/models/order';

// ==========================================
// API Functions
// ==========================================

export const ordersApi = {
  /**
   * Checkout: Tạo đơn hàng mới
   */
  checkout: (payload: CheckoutPayload) =>
    api.post<{
      success: boolean;
      order?: { id: string; orderCode: string; status: string; totalAmount: number; paymentMethod: string };
      checkoutUrl?: string | null;
      qrCode?: string | null;
      message?: string;
    }>('/orders/checkout', payload),

  /**
   * Poll trạng thái thanh toán (cho trang kết quả)
   */
  getPaymentStatus: (orderId: string) =>
    api.get<OrderRecord | null>(`/orders/${orderId}/payment-status`, {
      revalidate: false,
    }),

  /**
   * Khách xem đơn hàng của mình
   */
  getMyOrders: (authUserId: string) =>
    api.get<OrderRecord[]>('/orders/my-orders', {
      params: { authUserId },
      revalidate: false,
    }),

  /**
   * Khách hủy đơn hàng
   */
  cancelOrder: (orderId: string, authUserId: string) =>
    api.post<void>(`/orders/${orderId}/cancel`, { authUserId })
      .then(() => true)
      .catch(() => false),

  /**
   * Tra cứu đơn hàng theo mã đơn
   */
  getOrderLookup: (code: string) =>
    api.get<OrderRecord | null>(`/orders/lookup/${code}`, {
      revalidate: false,
    }),

  // ==========================================
  // ADMIN APIs
  // ==========================================

  /**
   * Admin: Danh sách đơn hàng (filter, pagination, search)
   */
  getAdminOrders: (query: GetOrdersQuery = {}, token: string) =>
    api.get<PaginatedResponse<OrderRecord>>('/orders/admin/list', {
      params: query as Record<string, string | number | boolean | undefined>,
      token,
      revalidate: false,
    }),

  /**
   * Admin: Chi tiết đơn hàng (kèm lịch sử trạng thái)
   */
  getAdminOrderDetail: (id: string, token: string) =>
    api.get<OrderRecord | null>(`/orders/admin/${id}`, {
      token,
      revalidate: false,
    }),

  /**
   * Admin: Đổi trạng thái đơn hàng
   */
  updateStatus: (id: string, status: string, note: string | undefined, token: string) =>
    api.patch<void>(`/orders/admin/${id}/status`, { status, note }, { token })
      .then(() => true),

  /**
   * Admin: Cập nhật thông tin vận chuyển
   */
  updateShipping: (id: string, data: { shippingCarrier?: string; trackingNumber?: string }, token: string) =>
    api.patch<void>(`/orders/admin/${id}/shipping`, data, { token })
      .then(() => true),

  /**
   * Admin: Sửa thông tin người nhận (SĐT/Địa chỉ) khi chưa gửi bưu cục
   */
  updateRecipient: (
    id: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      shippingProvince?: string;
      shippingDistrict?: string;
      shippingWard?: string;
      shippingAddress?: string;
      note?: string;
    },
    token: string
  ) =>
    api.patch<void>(`/orders/admin/${id}/recipient`, data, { token })
      .then(() => true),

  /**
   * Admin: Xóa đơn hàng
   */
  deleteOrder: (id: string, token: string) =>
    api.delete<void>(`/orders/admin/${id}`, { token })
      .then(() => true),

  /**
   * Admin: Cập nhật / xóa hàng loạt
   */
  bulkUpdate: (payload: {
    ids: string[];
    status?: string;
    action?: 'delete' | 'update_status';
  }, token: string) =>
    api.patch<void>('/orders/admin/bulk', payload, { token })
      .then(() => true),
};
