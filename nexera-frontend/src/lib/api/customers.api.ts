import { api } from './client';
import type { PaginatedResponse } from '@/types/api';
import type {
  CustomerProfile,
  SyncCustomerProfilePayload,
  UpdateCustomerPayload,
  GetCustomersQuery
} from '@/types/models/customer';

// Re-export types for backward compatibility
export type { CustomerProfile, SyncCustomerProfilePayload, UpdateCustomerPayload, GetCustomersQuery } from '@/types/models/customer';
export type { PaginatedResponse as GetCustomersResponse } from '@/types/api';

export const customersApi = {
  /**
   * Lấy hồ sơ khách hàng hiện tại
   */
  getMe: (authUserId?: string, email?: string) =>
    api.get<{ customer: CustomerProfile | null; isAdmin: boolean }>('/customers/me', {
      params: { authUserId, email },
    }),

  /**
   * Đồng bộ hồ sơ khách hàng khi đăng nhập / đăng ký
   */
  syncProfile: (payload: SyncCustomerProfilePayload) =>
    api.post<CustomerProfile>('/customers/sync-profile', payload),

  /**
   * Khách hàng tự cập nhật thông tin
   */
  updateMe: (authUserId: string, payload: UpdateCustomerPayload) =>
    api.put<CustomerProfile>('/customers/me', payload, {
      params: { authUserId },
    }),

  /**
   * Admin: Lấy danh sách khách hàng CRM (phân trang, lọc)
   */
  getAdminCustomers: (query: GetCustomersQuery, token: string) =>
    api.get<PaginatedResponse<CustomerProfile>>('/customers/admin/list', {
      params: query as Record<string, string | number | boolean | undefined>,
      token,
      revalidate: false,
    }),

  /**
   * Admin: Lấy chi tiết 360° khách hàng
   */
  getAdminCustomerById: (id: string, token: string) =>
    api.get<CustomerProfile | null>(`/customers/admin/${id}`, {
      token,
      revalidate: false,
    }),

  /**
   * Admin: Cập nhật thông tin khách hàng
   */
  updateCustomer: (id: string, payload: UpdateCustomerPayload, token: string) =>
    api.put<CustomerProfile>(`/customers/admin/${id}`, payload, { token }),

  /**
   * Admin: Cập nhật phân hạng (Tier)
   */
  updateTier: (id: string, tier: string, token: string) =>
    api.patch<void>(`/customers/admin/${id}/tier`, { tier }, { token }).then(() => true),

  /**
   * Admin: Thêm ghi chú CRM
   */
  addNote: (customerId: string, content: string, adminId: string | undefined, token: string) =>
    api.post<any>(`/customers/admin/${customerId}/notes`, { content, adminId }, { token }),

  /**
   * Admin: Xóa ghi chú CRM
   */
  deleteNote: (noteId: string, token: string) =>
    api.delete<void>(`/customers/admin/notes/${noteId}`, { token }).then(() => true),

  /**
   * Admin: Xóa khách hàng
   */
  deleteCustomer: (id: string, token: string) =>
    api.delete<void>(`/customers/admin/${id}`, { token }).then(() => true),
};
