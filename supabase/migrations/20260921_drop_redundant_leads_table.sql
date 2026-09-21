-- ============================================================================
-- MIGRATION: 20260921_drop_redundant_leads_table.sql
-- Description: Xóa bảng leads cũ do hệ thống đã chuyển sang dùng Live Chat
-- ============================================================================

-- Tắt Realtime cho bảng leads (nếu có)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.leads;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Xóa bảng leads
DROP TABLE IF EXISTS public.leads CASCADE;
