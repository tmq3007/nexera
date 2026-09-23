import { BACKEND_URL } from "./config";

export interface CustomerProfile {
  id: string;
  auth_user_id?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  phone_numbers?: string[] | null;
  emails?: string[] | null;
  address?: string | null;
  avatar_url?: string | null;
  tier?: "VIP" | "LOYAL" | "POTENTIAL" | "STANDARD" | string;
  notes?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string;
  orders?: {
    id: string;
    total_amount?: number;
    status?: string;
    created_at: string;
  }[];
  customer_notes?: {
    id: string;
    content: string;
    created_at: string;
    admin_id?: string | null;
  }[];
  conversations?: {
    id: string;
    status: string;
    last_message_preview?: string | null;
    last_message_at?: string | null;
  }[];
}

export interface SyncCustomerProfilePayload {
  authUserId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  guestSessionId?: string;
}

export interface UpdateCustomerPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  address?: string;
  avatarUrl?: string;
  phoneNumbers?: string[];
  emails?: string[];
  tags?: string[];
  notes?: string;
}

export interface GetCustomersQuery {
  q?: string;
  tier?: string;
  page?: number;
  limit?: number;
}

export interface GetCustomersResponse {
  data: CustomerProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const customersApi = {
  /**
   * Lấy hồ sơ khách hàng hiện tại
   */
  async getMe(authUserId?: string, email?: string): Promise<{ customer: CustomerProfile | null; isAdmin: boolean }> {
    try {
      const params = new URLSearchParams();
      if (authUserId) params.set("authUserId", authUserId);
      if (email) params.set("email", email);

      const res = await fetch(`${BACKEND_URL}/customers/me?${params.toString()}`);
      if (!res.ok) return { customer: null, isAdmin: false };
      return await res.json();
    } catch (error) {
      console.error("Lỗi getMe API:", error);
      return { customer: null, isAdmin: false };
    }
  },

  /**
   * Đồng bộ hồ sơ khách hàng khi đăng nhập / đăng ký
   */
  async syncProfile(payload: SyncCustomerProfilePayload): Promise<CustomerProfile | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/sync-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Sync profile failed: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi syncProfile API:", error);
      return null;
    }
  },

  /**
   * Khách hàng tự cập nhật thông tin
   */
  async updateMe(authUserId: string, payload: UpdateCustomerPayload): Promise<CustomerProfile | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/me?authUserId=${encodeURIComponent(authUserId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update profile failed: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi updateMe API:", error);
      return null;
    }
  },

  /**
   * Admin: Lấy danh sách khách hàng CRM (phân trang, lọc)
   */
  async getAdminCustomers(query: GetCustomersQuery): Promise<GetCustomersResponse> {
    try {
      const params = new URLSearchParams();
      if (query.q) params.set("q", query.q);
      if (query.tier) params.set("tier", query.tier);
      if (query.page) params.set("page", query.page.toString());
      if (query.limit) params.set("limit", query.limit.toString());

      const res = await fetch(`${BACKEND_URL}/customers/admin/list?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Get admin customers failed: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi getAdminCustomers API:", error);
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  },

  /**
   * Admin: Lấy chi tiết 360° khách hàng
   */
  async getAdminCustomerById(id: string): Promise<CustomerProfile | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/${id}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Lỗi getAdminCustomerById API:", error);
      return null;
    }
  },

  /**
   * Admin: Cập nhật thông tin khách hàng
   */
  async updateCustomer(id: string, payload: UpdateCustomerPayload): Promise<CustomerProfile | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Update customer failed: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi updateCustomer API:", error);
      return null;
    }
  },

  /**
   * Admin: Cập nhật phân hạng (Tier)
   */
  async updateTier(id: string, tier: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/${id}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      return res.ok;
    } catch (error) {
      console.error("Lỗi updateTier API:", error);
      return false;
    }
  },

  /**
   * Admin: Thêm ghi chú CRM
   */
  async addNote(customerId: string, content: string, adminId?: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, adminId }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Lỗi addNote API:", error);
      return null;
    }
  },

  /**
   * Admin: Xóa ghi chú CRM
   */
  async deleteNote(noteId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/notes/${noteId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Lỗi deleteNote API:", error);
      return false;
    }
  },

  /**
   * Admin: Xóa khách hàng
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/customers/admin/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (error) {
      console.error("Lỗi deleteCustomer API:", error);
      return false;
    }
  },
};
