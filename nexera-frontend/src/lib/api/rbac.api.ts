import { api } from './client';
import type { Role, Permission, AdminAccount } from '@/types/models/auth';

// Re-export types for backward compatibility
export type { Role, Permission, AdminAccount } from '@/types/models/auth';

export const rbacApi = {
  checkPermission: (authUserId: string, permission?: string) =>
    api.get<{
      hasPermission: boolean;
      isSuperAdmin: boolean;
      isActive: boolean;
      permissions: string[];
    }>('/rbac/check-permission', {
      params: { authUserId, permission },
      revalidate: false,
    }),

  // ----------------- ROLES -----------------
  getRoles: (token: string) =>
    api.get<Role[]>('/rbac/roles', { token, revalidate: false }),

  createRole: (data: { displayName: string; description?: string }, token: string) =>
    api.post<Role>('/rbac/roles', data, { token }),

  deleteRole: (id: string, token: string) =>
    api.delete<void>(`/rbac/roles/${id}`, { token }).then(() => true),

  // ----------------- PERMISSIONS -----------------
  getPermissions: (token: string) =>
    api.get<Permission[]>('/rbac/permissions', { token, revalidate: false }),

  getRolePermissions: (roleId: string, token: string) =>
    api.get<string[]>(`/rbac/roles/${roleId}/permissions`, { token, revalidate: false }),

  updateRolePermissions: (roleId: string, permissionIds: string[], token: string) =>
    api.put<void>(`/rbac/roles/${roleId}/permissions`, { permissionIds }, { token }).then(() => true),

  // ----------------- ADMIN ACCOUNTS -----------------
  getAdminAccounts: (token: string) =>
    api.get<AdminAccount[]>('/rbac/admin-accounts', { token, revalidate: false }),

  createAdminAccount: (data: {
    email: string;
    password: string;
    displayName: string;
    roleId: string;
  }, token: string) =>
    api.post<AdminAccount>('/rbac/admin-accounts', data, { token }),

  toggleAdminActive: (id: string, isActive: boolean | undefined, token: string) =>
    api.patch<AdminAccount>(`/rbac/admin-accounts/${id}/toggle-active`, { isActive }, { token }),

  updateAdminRole: (id: string, roleId: string, token: string) =>
    api.patch<AdminAccount>(`/rbac/admin-accounts/${id}/role`, { roleId }, { token }),
};
