import { api } from './client';
import type {
  ChatConversation,
  ChatMessageItem,
  GetConversationResponse,
  GetConversationParams,
  SendMessagePayload,
  SyncSessionPayload,
  IdentifyContactPayload
} from '@/types/models/chat';

// Re-export types for backward compatibility
export type { ChatCustomer, ChatConversation, ChatMessageItem, GetConversationResponse } from '@/types/models/chat';

export const chatApi = {
  /**
   * 1. Lấy hoặc khởi tạo hội thoại duy nhất của khách (Storefront)
   */
  getConversation: (params: GetConversationParams) =>
    api.get<GetConversationResponse>('/chat/conversation', {
      params: params as unknown as Record<string, string | number | boolean | undefined>,
    }),

  /**
   * 2. Lấy toàn bộ tin nhắn theo conversationId
   */
  getMessages: (conversationId: string) =>
    api.get<ChatMessageItem[]>(`/chat/messages/${conversationId}`),

  /**
   * 3. Gửi tin nhắn mới (Storefront hoặc Admin)
   */
  sendMessage: (data: SendMessagePayload) =>
    api.post<{ success: boolean; conversationId: string; message: ChatMessageItem }>('/chat/send', data),

  /**
   * 4. Gộp phiên vãng lai khi khách đăng nhập
   */
  syncSession: (data: SyncSessionPayload) =>
    api.post<any>('/chat/sync-session', data),

  /**
   * 5. Cập nhật thông tin khách để lại từ form chat
   */
  identifyContact: (data: IdentifyContactPayload) =>
    api.post<any>('/chat/identify-contact', data),

  /**
   * 6. Danh sách hội thoại dành cho Admin CRM
   */
  getAdminConversations: (token: string) =>
    api.get<ChatConversation[]>('/chat/admin/conversations', {
      token,
      revalidate: false,
    }),

  /**
   * 7. Admin tạo mới/liên kết khách hàng từ hội thoại
   */
  adminConvert: (data: {
    conversationId: string;
    fullName?: string;
    phone?: string;
    email?: string;
  }, token: string) =>
    api.post<any>('/chat/admin-convert', data, { token }),

  /**
   * 8. Admin phân công tư vấn viên
   */
  assignAdmin: (data: { conversationId: string; adminId: string }, token: string) =>
    api.post<any>('/chat/admin/assign', data, { token }),

  /**
   * 9. Admin cập nhật trạng thái hội thoại
   */
  updateStatus: (conversationId: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED', token: string) =>
    api.patch<any>('/chat/admin/conversation-status', { conversationId, status }, { token }),

  /**
   * 10. Admin thêm ghi chú chăm sóc khách hàng
   */
  addCustomerNote: (customerId: string, content: string, authorName: string | undefined, token: string) =>
    api.post<any>('/chat/admin/customer-notes', { customerId, content, authorName }, { token }),

  /**
   * 11. Admin lấy thông tin 360 khách hàng (Orders & Notes)
   */
  getCustomerDetails: (customerId: string, token: string) =>
    api.get<any>(`/chat/admin/customer-details/${customerId}`, { token }),

  /**
   * 12. Lấy thông tin tài khoản Admin
   */
  getAdminInfo: (authUserId: string) =>
    api.get<any>(`/chat/admin/info/${authUserId}`),

  /**
   * 13. Lấy sản phẩm active đính kèm nhanh
   */
  getQuickProducts: () =>
    api.get<any[]>('/chat/products-quick'),
};
