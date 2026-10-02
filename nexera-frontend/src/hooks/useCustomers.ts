import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers.api';
import { useAuth } from '@/contexts/AuthContext';
import type { GetCustomersQuery, UpdateCustomerPayload } from '@/types/models/customer';

export const customerKeys = {
  all: ['customers'] as const,
  me: (authUserId?: string) => [...customerKeys.all, 'me', authUserId] as const,
  adminList: (query: GetCustomersQuery) => [...customerKeys.all, 'admin', query] as const,
  adminDetail: (id: string) => [...customerKeys.all, 'admin', 'detail', id] as const,
};

export function useCustomerMe(authUserId?: string, email?: string) {
  return useQuery({
    queryKey: customerKeys.me(authUserId),
    queryFn: () => customersApi.getMe(authUserId, email),
    enabled: !!authUserId || !!email,
  });
}

export function useAdminCustomers(query: GetCustomersQuery) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: customerKeys.adminList(query),
    queryFn: () => customersApi.getAdminCustomers(query, accessToken!),
    enabled: !!accessToken,
  });
}

export function useAdminCustomerDetail(id: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: customerKeys.adminDetail(id),
    queryFn: () => customersApi.getAdminCustomerById(id, accessToken!),
    enabled: !!id && !!accessToken,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  const { accessToken } = useAuth();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      customersApi.updateCustomer(id, payload, accessToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
  });
}
