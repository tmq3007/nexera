import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders.api';
import { useAuth } from '@/contexts/AuthContext';
import type { CheckoutPayload, GetOrdersQuery } from '@/types/models/order';

export const orderKeys = {
  all: ['orders'] as const,
  myOrders: (userId: string) => [...orderKeys.all, 'my', userId] as const,
  adminList: (query: GetOrdersQuery) => [...orderKeys.all, 'admin', query] as const,
  adminDetail: (id: string) => [...orderKeys.all, 'admin', 'detail', id] as const,
  paymentStatus: (id: string) => [...orderKeys.all, 'payment', id] as const,
  lookup: (code: string) => [...orderKeys.all, 'lookup', code] as const,
};

export function useMyOrders(authUserId: string) {
  return useQuery({
    queryKey: orderKeys.myOrders(authUserId),
    queryFn: () => ordersApi.getMyOrders(authUserId),
    enabled: !!authUserId,
  });
}

export function useAdminOrders(query: GetOrdersQuery = {}) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: orderKeys.adminList(query),
    queryFn: () => ordersApi.getAdminOrders(query, accessToken!),
    enabled: !!accessToken,
  });
}

export function useAdminOrderDetail(id: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: orderKeys.adminDetail(id),
    queryFn: () => ordersApi.getAdminOrderDetail(id, accessToken!),
    enabled: !!id && !!accessToken,
  });
}

export function usePaymentStatus(orderId: string) {
  return useQuery({
    queryKey: orderKeys.paymentStatus(orderId),
    queryFn: () => ordersApi.getPaymentStatus(orderId),
    enabled: !!orderId,
    refetchInterval: 3000, // poll every 3s for payment status
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: (payload: CheckoutPayload) =>
      ordersApi.checkout(payload),
  });
}

export function useOrderLookup(code: string) {
  return useQuery({
    queryKey: orderKeys.lookup(code),
    queryFn: () => ordersApi.getOrderLookup(code),
    enabled: !!code,
  });
}
