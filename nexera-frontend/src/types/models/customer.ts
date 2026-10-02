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
