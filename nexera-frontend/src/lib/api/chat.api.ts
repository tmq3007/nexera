const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export interface ChatCustomer {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  tier?: string;
  address?: string;
}

export interface ChatConversation {
  id: string;
  customer_id?: string | null;
  guest_session_id?: string;
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED' | 'MERGED';
  last_message_preview?: string;
  last_message_at?: string;
  unread_admin_count?: number;
  unread_customer_count?: number;
  assigned_admin_id?: string | null;
  created_at: string;
  customer?: ChatCustomer;
}

export interface ChatMessageItem {
  id: string;
  conversation_id: string;
  sender_type: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  sender_id?: string | null;
  sender_name: string;
  content: string;
  attachments?: any[];
  is_read?: boolean;
  created_at: string;
}

export interface GetConversationResponse {
  conversation: ChatConversation | null;
  messages: ChatMessageItem[];
  customer: ChatCustomer | null;
}

export const chatApi = {
  /**
   * 1. Lấy hoặc khởi tạo hội thoại duy nhất của khách (Storefront)
   */
  async getConversation(params: {
    guestSessionId: string;
    authUserId?: string;
    email?: string;
    customerId?: string;
  }): Promise<GetConversationResponse> {
    const query = new URLSearchParams();
    query.append("guestSessionId", params.guestSessionId);
    if (params.authUserId) query.append("authUserId", params.authUserId);
    if (params.email) query.append("email", params.email);
    if (params.customerId) query.append("customerId", params.customerId);

    const res = await fetch(`${BACKEND_URL}/chat/conversation?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Lỗi lấy hội thoại chat: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 2. Lấy toàn bộ tin nhắn theo conversationId
   */
  async getMessages(conversationId: string): Promise<ChatMessageItem[]> {
    const res = await fetch(`${BACKEND_URL}/chat/messages/${conversationId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Lỗi lấy danh sách tin nhắn: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 3. Gửi tin nhắn mới (Storefront hoặc Admin)
   */
  async sendMessage(data: {
    conversationId?: string;
    guestSessionId?: string;
    content: string;
    attachments?: any[];
    senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
    senderName: string;
    senderId?: string;
  }): Promise<{ success: boolean; conversationId: string; message: ChatMessageItem }> {
    const res = await fetch(`${BACKEND_URL}/chat/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Lỗi gửi tin nhắn: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 4. Gộp phiên vãng lai khi khách đăng nhập
   */
  async syncSession(data: {
    guestSessionId: string;
    customerId?: string;
    authUserId?: string;
    email?: string;
    fullName?: string;
    phone?: string;
  }) {
    const res = await fetch(`${BACKEND_URL}/chat/sync-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Lỗi đồng bộ phiên chat: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 5. Cập nhật thông tin khách để lại từ form chat
   */
  async identifyContact(data: {
    guestSessionId: string;
    conversationId?: string;
    fullName?: string;
    phone?: string;
    email?: string;
  }) {
    const res = await fetch(`${BACKEND_URL}/chat/identify-contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Lỗi cập nhật thông tin liên hệ: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 6. Danh sách hội thoại dành cho Admin CRM
   */
  async getAdminConversations(): Promise<ChatConversation[]> {
    const res = await fetch(`${BACKEND_URL}/chat/admin/conversations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Lỗi lấy danh sách hội thoại Admin: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 7. Admin tạo mới/liên kết khách hàng từ hội thoại
   */
  async adminConvert(data: {
    conversationId: string;
    fullName?: string;
    phone?: string;
    email?: string;
  }) {
    const res = await fetch(`${BACKEND_URL}/chat/admin-convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Lỗi tạo/liên kết khách hàng từ admin: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 8. Admin phân công tư vấn viên
   */
  async assignAdmin(data: { conversationId: string; adminId: string }) {
    const res = await fetch(`${BACKEND_URL}/chat/admin/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Lỗi phân công tư vấn viên: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 9. Admin cập nhật trạng thái hội thoại
   */
  async updateStatus(conversationId: string, status: 'OPEN' | 'RESOLVED' | 'CLOSED') {
    const res = await fetch(`${BACKEND_URL}/chat/admin/conversation-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, status }),
    });

    if (!res.ok) {
      throw new Error(`Lỗi cập nhật trạng thái hội thoại: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 10. Admin thêm ghi chú chăm sóc khách hàng
   */
  async addCustomerNote(customerId: string, content: string, authorName?: string) {
    const res = await fetch(`${BACKEND_URL}/chat/admin/customer-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, content, authorName }),
    });

    if (!res.ok) {
      throw new Error(`Lỗi thêm ghi chú khách hàng: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 11. Admin lấy thông tin 360 khách hàng (Orders & Notes)
   */
  async getCustomerDetails(customerId: string) {
    const res = await fetch(`${BACKEND_URL}/chat/admin/customer-details/${customerId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Lỗi lấy thông tin khách hàng: ${res.statusText}`);
    }
    return res.json();
  },

  /**
   * 12. Lấy thông tin tài khoản Admin
   */
  async getAdminInfo(authUserId: string) {
    const res = await fetch(`${BACKEND_URL}/chat/admin/info/${authUserId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  },

  /**
   * 13. Lấy sản phẩm active đính kèm nhanh
   */
  async getQuickProducts() {
    const res = await fetch(`${BACKEND_URL}/chat/products-quick`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    return res.json();
  }
};

