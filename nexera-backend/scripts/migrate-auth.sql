-- 1. Thêm cột email và password_hash vào customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- Bỏ constraint tạm (tùy chọn)
-- ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_auth_user_id_fkey;

-- 2. Thêm cột email và password_hash vào admin_accounts
ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE admin_accounts ADD COLUMN IF NOT EXISTS password_hash TEXT;
-- Bỏ constraint tạm (tùy chọn)
-- ALTER TABLE admin_accounts DROP CONSTRAINT IF EXISTS admin_accounts_auth_user_id_fkey;

-- 3. Migrate data từ auth.users sang customers (Dữ liệu cũ)
UPDATE customers
SET 
  email = auth.users.email,
  -- Supabase dùng thuật toán bcrypt cho mật khẩu, có thể copy thẳng!
  password_hash = auth.users.encrypted_password
FROM auth.users
WHERE customers.auth_user_id = auth.users.id;

-- 4. Migrate data từ auth.users sang admin_accounts (Dữ liệu cũ)
UPDATE admin_accounts
SET 
  email = auth.users.email,
  password_hash = auth.users.encrypted_password
FROM auth.users
WHERE admin_accounts.auth_user_id = auth.users.id;

-- Ghi chú: Hãy chạy script này trong cửa sổ SQL Editor của Supabase Dashboard
