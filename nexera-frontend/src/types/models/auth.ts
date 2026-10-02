export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  is_system: boolean;
  created_at?: string;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  module: string;
  description?: string | null;
}

export interface AdminAccount {
  id: string;
  auth_user_id: string;
  display_name: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  roles?: Role;
}
