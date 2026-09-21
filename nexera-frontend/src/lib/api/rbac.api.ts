const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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

export const rbacApi = {
  async checkPermission(authUserId: string, permission?: string): Promise<{
    hasPermission: boolean;
    isSuperAdmin: boolean;
    isActive: boolean;
    permissions: string[];
  }> {
    try {
      const params = new URLSearchParams({ authUserId });
      if (permission) params.set("permission", permission);
      const res = await fetch(`${BACKEND_URL}/rbac/check-permission?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return { hasPermission: false, isSuperAdmin: false, isActive: false, permissions: [] };
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi checkPermission:", err);
      return { hasPermission: false, isSuperAdmin: false, isActive: false, permissions: [] };
    }
  },

  // ----------------- ROLES -----------------
  async getRoles(): Promise<Role[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/roles`, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getRoles:", err);
      return [];
    }
  },

  async createRole(data: { displayName: string; description?: string }): Promise<Role | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi tạo vai trò");
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi createRole:", err);
      throw err;
    }
  },

  async deleteRole(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/roles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi xóa vai trò");
      }
      return true;
    } catch (err) {
      console.error("Lỗi deleteRole:", err);
      throw err;
    }
  },

  // ----------------- PERMISSIONS -----------------
  async getPermissions(): Promise<Permission[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/permissions`, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getPermissions:", err);
      return [];
    }
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/roles/${roleId}/permissions`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getRolePermissions:", err);
      return [];
    }
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionIds }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi cập nhật quyền hạn");
      }
      return true;
    } catch (err) {
      console.error("Lỗi updateRolePermissions:", err);
      throw err;
    }
  },

  // ----------------- ADMIN ACCOUNTS -----------------
  async getAdminAccounts(): Promise<AdminAccount[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/admin-accounts`, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getAdminAccounts:", err);
      return [];
    }
  },

  async createAdminAccount(data: {
    email: string;
    password: string;
    displayName: string;
    roleId: string;
  }): Promise<AdminAccount | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/admin-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi tạo tài khoản quản trị");
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi createAdminAccount:", err);
      throw err;
    }
  },

  async toggleAdminActive(id: string, isActive?: boolean): Promise<AdminAccount | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/admin-accounts/${id}/toggle-active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi cập nhật trạng thái");
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi toggleAdminActive:", err);
      throw err;
    }
  },

  async updateAdminRole(id: string, roleId: string): Promise<AdminAccount | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/rbac/admin-accounts/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi cập nhật vai trò");
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi updateAdminRole:", err);
      throw err;
    }
  },
};
