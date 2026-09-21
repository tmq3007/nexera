-- ============================================================================
-- MIGRATION: 20260921_add_merge_conversations_rpc.sql
-- Description: Tạo function để gộp lịch sử chat của Guest vào Customer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.merge_guest_conversation(
  p_customer_id uuid,
  p_guest_session_id text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_conv_id uuid;
  v_primary_conv_id uuid;
  v_cust_name text;
BEGIN
  -- Lấy tên khách hàng
  SELECT full_name INTO v_cust_name
  FROM public.customers
  WHERE id = p_customer_id;

  -- 1. Tìm hội thoại của guest (chưa có customer_id)
  SELECT id INTO v_guest_conv_id
  FROM public.conversations
  WHERE guest_session_id = p_guest_session_id
    AND customer_id IS NULL
    AND status != 'MERGED'
  ORDER BY created_at DESC
  LIMIT 1;

  -- 2. Tìm hội thoại chính của customer (nếu có)
  SELECT id INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = p_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC -- Lấy hội thoại gốc đầu tiên của khách
  LIMIT 1;

  -- Trường hợp 1: Khách chưa có hội thoại nào trước đây, nhưng có hội thoại guest
  IF v_primary_conv_id IS NULL AND v_guest_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET customer_id = p_customer_id,
        guest_name = COALESCE(v_cust_name, guest_name)
    WHERE id = v_guest_conv_id;

    UPDATE public.chat_messages
    SET sender_id = COALESCE(sender_id, p_customer_id),
        sender_name = COALESCE(v_cust_name, sender_name)
    WHERE conversation_id = v_guest_conv_id
      AND sender_type = 'CUSTOMER';

    RETURN v_guest_conv_id;
  END IF;

  -- Trường hợp 2: Khách đã có hội thoại chính, và cũng có hội thoại guest
  IF v_primary_conv_id IS NOT NULL AND v_guest_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    -- Chuyển toàn bộ tin nhắn từ hội thoại guest sang hội thoại chính
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = COALESCE(sender_id, p_customer_id),
        sender_name = COALESCE(v_cust_name, sender_name)
    WHERE conversation_id = v_guest_conv_id;

    -- Đánh dấu hội thoại guest là MERGED để không hiển thị nữa
    UPDATE public.conversations
    SET status = 'MERGED',
        customer_id = p_customer_id
    WHERE id = v_guest_conv_id;

    -- Cập nhật last_message_at và last_message_preview của hội thoại chính
    UPDATE public.conversations
    SET last_message_at = (SELECT last_message_at FROM public.conversations WHERE id = v_guest_conv_id),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;

    RETURN v_primary_conv_id;
  END IF;

  -- Trường hợp 3: Khách có hội thoại chính, nhưng không có hội thoại guest nào
  IF v_primary_conv_id IS NOT NULL THEN
    RETURN v_primary_conv_id;
  END IF;

  RETURN NULL;
END;
$$;
