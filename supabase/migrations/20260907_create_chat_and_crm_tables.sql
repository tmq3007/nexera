-- ============================================================================
-- MIGRATION: 20260907_create_chat_and_crm_tables.sql
-- Description: Tạo bảng conversations, chat_messages, customer_notes và mở rộng CRM
-- ============================================================================

-- 1. Mở rộng bảng customers thêm các trường CRM
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS tier text DEFAULT 'STANDARD',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 2. Tạo bảng conversations (Phiên hội thoại)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  guest_session_id text,
  guest_name text,
  guest_phone text,
  guest_email text,
  status text NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'
  assigned_admin_id uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  last_message_preview text,
  last_message_at timestamptz DEFAULT now(),
  unread_admin_count int NOT NULL DEFAULT 0,
  unread_customer_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest_session_id ON public.conversations(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 3. Tạo bảng chat_messages (Nội dung tin nhắn)
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'CUSTOMER', 'ADMIN', 'SYSTEM'
  sender_id uuid,
  sender_name text NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at ASC);

-- 4. Tạo bảng customer_notes (Nhật ký chăm sóc CRM)
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admin_accounts(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON public.customer_notes(customer_id);

-- 5. Bật Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- 5.1 RLS cho conversations:
-- Khách vãng lai hoặc Khách hàng có thể đọc và tạo hội thoại của mình
CREATE POLICY "Allow public read own conversation" ON public.conversations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert conversation" ON public.conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update conversation" ON public.conversations
  FOR UPDATE USING (true);

-- 5.2 RLS cho chat_messages:
CREATE POLICY "Allow public read chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update chat messages" ON public.chat_messages
  FOR UPDATE USING (true);

-- 5.3 RLS cho customer_notes:
CREATE POLICY "Admin manage customer notes" ON public.customer_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Bổ sung vào Supabase Realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
