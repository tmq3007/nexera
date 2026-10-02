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

export interface SendMessagePayload {
  conversationId?: string;
  guestSessionId?: string;
  content: string;
  attachments?: any[];
  senderType: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  senderName: string;
  senderId?: string;
}

export interface GetConversationParams {
  guestSessionId: string;
  authUserId?: string;
  email?: string;
  customerId?: string;
}

export interface SyncSessionPayload {
  guestSessionId: string;
  customerId?: string;
  authUserId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
}

export interface IdentifyContactPayload {
  guestSessionId: string;
  conversationId?: string;
  fullName?: string;
  phone?: string;
  email?: string;
}
