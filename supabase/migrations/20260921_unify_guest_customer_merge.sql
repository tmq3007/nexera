-- ============================================================================
-- MIGRATION: 20260921_unify_guest_customer_merge.sql
-- Description: Chuẩn hóa toàn diện cơ chế gộp danh tính Khách vãng lai -> Khách hàng
--              theo chuẩn kiến trúc hệ thống CRM & Live Chat quốc tế (Intercom / Crisp).
-- ============================================================================

-- 1. Cập nhật RLS Policies cho bảng public.customers
-- Cho phép Customer tự tạo profile khi đăng nhập nếu chưa có, và tự liên kết tài khoản
DROP POLICY IF EXISTS "Customer tạo hồ sơ cá nhân" ON public.customers;
CREATE POLICY "Customer tạo hồ sơ cá nhân" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Customer đọc thông tin cá nhân" ON public.customers;
CREATE POLICY "Customer đọc thông tin cá nhân" ON public.customers
  FOR SELECT TO authenticated
  USING (
    auth.uid() = auth_user_id 
    OR email = (auth.jwt()->>'email')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Customer sửa thông tin cá nhân" ON public.customers;
CREATE POLICY "Customer sửa thông tin cá nhân" ON public.customers
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = auth_user_id 
    OR (auth_user_id IS NULL AND email = (auth.jwt()->>'email'))
    OR public.is_admin()
  );

-- 2. Hàm RPC Tối Thượng: sync_customer_chat_session
-- Tự động nhận diện auth.uid(), tìm/tạo hồ sơ Customer và gộp toàn bộ lịch sử phiên vãng lai
CREATE OR REPLACE FUNCTION public.sync_customer_chat_session(p_guest_session_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_uid uuid;
  v_user_email text;
  v_user_meta_name text;
  v_customer_id uuid;
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_phones text[];
  v_emails text[];
  
  v_guest_conv_id uuid;
  v_guest_phone text;
  v_guest_email text;
  v_primary_conv_id uuid;
BEGIN
  -- Lấy auth_uid của người đang gọi
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Lấy thông tin tài khoản từ auth.users
  SELECT 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
  INTO v_user_email, v_user_meta_name
  FROM auth.users
  WHERE id = v_auth_uid;

  -- 1. Tìm hoặc tạo bản ghi Customer
  SELECT id, full_name, phone, email, phone_numbers, emails
  INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails
  FROM public.customers
  WHERE auth_user_id = v_auth_uid
  LIMIT 1;

  -- Nếu chưa có theo auth_user_id, tìm theo email
  IF v_customer_id IS NULL AND v_user_email IS NOT NULL THEN
    SELECT id, full_name, phone, email, phone_numbers, emails
    INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails
    FROM public.customers
    WHERE email = v_user_email
    LIMIT 1;

    -- Nếu tìm thấy theo email, cập nhật liên kết auth_user_id
    IF v_customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET auth_user_id = v_auth_uid
      WHERE id = v_customer_id;
    END IF;
  END IF;

  -- Nếu vẫn chưa có bản ghi customer, tạo mới ngay lập tức
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (auth_user_id, email, full_name, emails)
    VALUES (
      v_auth_uid, 
      v_user_email, 
      COALESCE(v_user_meta_name, 'Khách hàng'),
      CASE WHEN v_user_email IS NOT NULL THEN ARRAY[v_user_email] ELSE '{}'::text[] END
    )
    RETURNING id, full_name, phone, email, phone_numbers, emails
    INTO v_customer_id, v_customer_name, v_customer_phone, v_customer_email, v_phones, v_emails;
  END IF;

  -- Đảm bảo có tên hiển thị chuẩn
  IF v_customer_name IS NULL OR v_customer_name = '' OR v_customer_name = 'Khách vãng lai' THEN
    v_customer_name := COALESCE(v_user_meta_name, split_part(v_user_email, '@', 1), 'Khách hàng');
    UPDATE public.customers SET full_name = v_customer_name WHERE id = v_customer_id;
  END IF;

  -- 2. Tìm cuộc hội thoại vãng lai tương ứng với guest_session_id
  IF p_guest_session_id IS NOT NULL AND p_guest_session_id != '' THEN
    SELECT id, guest_phone, guest_email
    INTO v_guest_conv_id, v_guest_phone, v_guest_email
    FROM public.conversations
    WHERE guest_session_id = p_guest_session_id
      AND (customer_id IS NULL OR customer_id != v_customer_id)
      AND status != 'MERGED'
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  -- Tìm hội thoại chính thức của khách hàng (nếu đã có trước đó)
  SELECT id
  INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = v_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC
  LIMIT 1;

  -- 3. Gom SĐT và Email từ phiên vãng lai vào hồ sơ CRM của khách hàng
  IF v_guest_conv_id IS NOT NULL THEN
    v_phones := COALESCE(v_phones, '{}'::text[]);
    v_emails := COALESCE(v_emails, '{}'::text[]);

    IF v_guest_phone IS NOT NULL AND v_guest_phone != '' AND NOT (v_guest_phone = ANY(v_phones)) THEN
      v_phones := array_append(v_phones, v_guest_phone);
    END IF;

    IF v_guest_email IS NOT NULL AND v_guest_email != '' AND NOT (v_guest_email = ANY(v_emails)) THEN
      v_emails := array_append(v_emails, v_guest_email);
    END IF;

    UPDATE public.customers
    SET phone = COALESCE(phone, v_guest_phone),
        email = COALESCE(email, v_guest_email, v_user_email),
        phone_numbers = v_phones,
        emails = v_emails
    WHERE id = v_customer_id;
  END IF;

  -- 4. Xử lý Gộp hội thoại
  -- Trường hợp A: Khách đã có hội thoại chính và cũng có hội thoại vãng lai
  IF v_primary_conv_id IS NOT NULL AND v_guest_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    -- Chuyển toàn bộ tin nhắn từ hội thoại vãng lai sang hội thoại chính
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = v_customer_id,
        sender_name = v_customer_name
    WHERE conversation_id = v_guest_conv_id;

    -- Đánh dấu hội thoại vãng lai là MERGED (Ẩn khỏi Admin)
    UPDATE public.conversations
    SET status = 'MERGED',
        customer_id = v_customer_id,
        guest_name = v_customer_name
    WHERE id = v_guest_conv_id;

    -- Cập nhật tin nhắn xem trước và thời gian mới nhất cho hội thoại chính
    UPDATE public.conversations
    SET last_message_at = now(),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;

    RETURN v_primary_conv_id;
  END IF;

  -- Trường hợp B: Khách chưa có hội thoại chính nào -> Thăng cấp hội thoại vãng lai thành hội thoại chính thức
  IF v_guest_conv_id IS NOT NULL THEN
    UPDATE public.conversations
    SET customer_id = v_customer_id,
        guest_name = v_customer_name,
        guest_phone = COALESCE(v_customer_phone, v_guest_phone),
        guest_email = COALESCE(v_customer_email, v_guest_email, v_user_email)
    WHERE id = v_guest_conv_id;

    -- Cập nhật quyền sở hữu và tên người gửi cho toàn bộ tin nhắn của khách trong hội thoại
    UPDATE public.chat_messages
    SET sender_id = v_customer_id,
        sender_name = v_customer_name
    WHERE conversation_id = v_guest_conv_id
      AND sender_type = 'CUSTOMER';

    RETURN v_guest_conv_id;
  END IF;

  -- Trường hợp C: Đã có sẵn hội thoại chính
  IF v_primary_conv_id IS NOT NULL THEN
    -- Đảm bảo tên hiển thị của hội thoại khớp với tên khách
    UPDATE public.conversations
    SET guest_name = v_customer_name
    WHERE id = v_primary_conv_id AND (guest_name IS NULL OR guest_name = 'Khách vãng lai');

    RETURN v_primary_conv_id;
  END IF;

  RETURN NULL;
END;
$$;

-- 3. Hàm tương thích ngược: merge_guest_conversation(p_customer_id, p_guest_session_id)
CREATE OR REPLACE FUNCTION public.merge_guest_conversation(p_customer_id UUID, p_guest_session_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cust_name text;
  v_guest_conv_id uuid;
  v_primary_conv_id uuid;
BEGIN
  SELECT full_name INTO v_cust_name FROM public.customers WHERE id = p_customer_id;
  IF v_cust_name IS NULL THEN
    v_cust_name := 'Khách hàng';
  END IF;

  SELECT id INTO v_guest_conv_id
  FROM public.conversations
  WHERE guest_session_id = p_guest_session_id 
    AND customer_id IS NULL
    AND status != 'MERGED'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_guest_conv_id IS NULL THEN
    RETURN;
  END IF;

  SELECT id INTO v_primary_conv_id
  FROM public.conversations
  WHERE customer_id = p_customer_id
    AND status != 'MERGED'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_primary_conv_id IS NOT NULL AND v_primary_conv_id != v_guest_conv_id THEN
    UPDATE public.chat_messages
    SET conversation_id = v_primary_conv_id,
        sender_id = p_customer_id,
        sender_name = v_cust_name
    WHERE conversation_id = v_guest_conv_id;

    UPDATE public.conversations
    SET status = 'MERGED', customer_id = p_customer_id, guest_name = v_cust_name
    WHERE id = v_guest_conv_id;

    UPDATE public.conversations
    SET last_message_at = now(),
        last_message_preview = (SELECT last_message_preview FROM public.conversations WHERE id = v_guest_conv_id)
    WHERE id = v_primary_conv_id;
  ELSE
    UPDATE public.conversations
    SET customer_id = p_customer_id,
        guest_name = v_cust_name
    WHERE id = v_guest_conv_id;

    UPDATE public.chat_messages
    SET sender_id = p_customer_id,
        sender_name = v_cust_name
    WHERE conversation_id = v_guest_conv_id AND sender_type = 'CUSTOMER';
  END IF;
END;
$$;
