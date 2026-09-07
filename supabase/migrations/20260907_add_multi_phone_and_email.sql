-- ============================================================================
-- MIGRATION: 20260907_add_multi_phone_and_email.sql
-- Description: Bổ sung phone_numbers TEXT[] và emails TEXT[] cho bảng customers
-- ============================================================================

ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS phone_numbers TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emails TEXT[] DEFAULT '{}';

-- Cập nhật dữ liệu hiện có
UPDATE public.customers
SET 
  phone_numbers = CASE 
    WHEN phone IS NOT NULL AND phone != '' AND NOT (phone = ANY(phone_numbers)) 
    THEN array_append(phone_numbers, phone) 
    ELSE phone_numbers 
  END,
  emails = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT (email = ANY(emails)) 
    THEN array_append(emails, email) 
    ELSE emails 
  END;
