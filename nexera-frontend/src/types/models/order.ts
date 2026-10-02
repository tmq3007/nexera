import { OrderStatus, PaymentMethod, PaymentStatus, OrderCancelledBy } from '@/types/enums';

export type PaymentStatusType = PaymentStatus;
export { OrderStatus, PaymentMethod, PaymentStatus, OrderCancelledBy };

// Nút hành động theo trạng thái hiện tại (Chuẩn 3PL)
export const STATUS_ACTIONS: Record<OrderStatus, { label: string; nextStatus: OrderStatus; color: string } | null> = {
  PENDING_PAYMENT: { label: 'Xác nhận Đã TT', nextStatus: 'CONFIRMED', color: 'bg-blue-600 hover:bg-blue-700' },
  CONFIRMED: { label: 'Duyệt đóng gói', nextStatus: 'PROCESSING', color: 'bg-blue-600 hover:bg-blue-700' },
  PROCESSING: { label: 'Gửi bưu cục', nextStatus: 'SHIPPED', color: 'bg-purple-600 hover:bg-purple-700' },
  SHIPPED: { label: 'Đã giao thành công', nextStatus: 'DELIVERED', color: 'bg-emerald-600 hover:bg-emerald-700' },
  DELIVERED: null,
  RETURNED: null,
  CANCELLED: null,
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

export interface CheckoutPayload {
  authUserId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingAddress: string;
  paymentMethod: PaymentMethod;
  note?: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface GetOrdersQuery {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
