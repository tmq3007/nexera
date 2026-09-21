"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { rbacApi, Role, Permission } from "@/lib/api/rbac.api";
import {
  Lock,
  Plus,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Save,
  Info,
  Layers,
  Trash2,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

export default function RolesAndPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal State - Create Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const checkPermissionAndFetchData = async () => {
    setLoading(true);
    try {
      // 1. Kiểm tra session hiện tại
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      // Kiểm tra quyền qua backend API
      const permCheck = await rbacApi.checkPermission(user.id, "admin.manage_roles");
      setHasPermission(permCheck.hasPermission);

      if (!permCheck.hasPermission) {
        setLoading(false);
        return;
      }

      // 2. Fetch Roles & Permissions
      const [rolesData, permData] = await Promise.all([
        rbacApi.getRoles(),
        rbacApi.getPermissions(),
      ]);

      setRoles(rolesData);
      setPermissions(permData);

      if (rolesData.length > 0) {
        const activeRole = selectedRole
          ? rolesData.find(r => r.id === selectedRole.id) || rolesData[0]
          : rolesData[0];
        setSelectedRole(activeRole);
        await fetchPermissionsForRole(activeRole.id);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải Roles/Permissions:", err);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionsForRole = async (roleId: string) => {
    try {
      const perms = await rbacApi.getRolePermissions(roleId);
      setRolePermissions(perms);
    } catch (err) {
      console.error("Lỗi fetchPermissionsForRole:", err);
    }
  };

  useEffect(() => {
    checkPermissionAndFetchData();
  }, []);

  const handleSelectRole = async (role: Role) => {
    setSelectedRole(role);
    setSaveSuccess(false);
    await fetchPermissionsForRole(role.id);
  };

  const handleTogglePermission = (permissionId: string) => {
    setRolePermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleToggleModulePermissions = (moduleName: string, modulePermIds: string[]) => {
    const allSelected = modulePermIds.every(id => rolePermissions.includes(id));
    if (allSelected) {
      setRolePermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      setRolePermissions(prev => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await rbacApi.updateRolePermissions(selectedRole.id, rolePermissions);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Lỗi khi lưu phân quyền: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError(null);

    try {
      const newRole = await rbacApi.createRole({
        displayName: newRoleDisplayName,
        description: newRoleDescription,
      });

      await checkPermissionAndFetchData();
      if (newRole) {
        setSelectedRole(newRole);
        setRolePermissions([]);
      }

      setIsModalOpen(false);
      setNewRoleDisplayName("");
      setNewRoleDescription("");
    } catch (err: any) {
      setModalError(err.message || "Đã xảy ra lỗi khi tạo Vai trò mới");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system) {
      alert("Không thể xóa vai trò mặc định của hệ thống!");
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa vai trò "${role.display_name}"?`)) return;

    try {
      await rbacApi.deleteRole(role.id);

      await checkPermissionAndFetchData();
      setSelectedRole(null);
    } catch (err: any) {
      alert("Lỗi khi xóa vai trò: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-100 text-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--primary)]" />
        <p className="text-sm">Đang xác thực quyền truy cập...</p>
      </div>
    );
  }

  // Access Denied Screen if user lacks permission `admin.manage_roles`
  if (hasPermission === false) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Bạn Không Có Quyền Truy Cập</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Tính năng <strong>"Vai trò & Phân quyền"</strong> yêu cầu quyền <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">admin.manage_roles</code> hoặc vai trò Quản trị viên cấp cao (Super Admin). Vui lòng liên hệ quản trị viên để được cấp quyền.
        </p>
        <div className="pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Về Bảng Điều Khiển
          </Link>
        </div>
      </div>
    );
  }

  const groupedPermissions: { [key: string]: Permission[] } = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {} as { [key: string]: Permission[] });

  const getModuleNameInVietnamese = (mod: string) => {
    const map: Record<string, string> = {
      dashboard: "Tổng Quan & Báo Cáo",
      products: "Quản Lý Sản Phẩm",
      categories: "Quản Lý Danh Mục",
      orders: "Quản Lý Đơn Hàng",
      customers: "Quản Lý Khách Hàng",
      leads: "Yêu Cầu Tư Vấn (CRM)",
      articles: "Quản Lý Bài Viết",
      projects: "Quản Lý Dự Án",
      admin: "Quản Trị Hệ Thống & Phân Quyền"
    };
    return map[mod] || mod.toUpperCase();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] overflow-hidden">

      {/* Page Header (Fixed) */}
      <div className="mb-4 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Vai trò & Phân quyền</h1>
          <p className="text-gray-500 text-sm mt-1">
            Định nghĩa các vai trò quản trị và phân quyền truy cập tính năng chi tiết cho từng module
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo Vai Trò Mới
        </button>
      </div>

      {/* Fixed Main Grid (2 Independent Scroll Panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">

        {/* Left Column: Role List (Internal Scrollable) */}
        <div className="lg:col-span-1 flex flex-col h-full min-h-0 overflow-hidden space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider px-1 flex items-center gap-2 flex-shrink-0">
            <Layers className="w-4 h-4 text-[var(--primary)]" /> Danh Sách Vai Trò ({roles.length})
          </h2>

          <div className="bg-white rounded-xl border border-gray-100 p-2 space-y-1 overflow-y-auto flex-1">
            {roles.map(role => {
              const isSelected = selectedRole?.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelectRole(role)}
                  className={`p-3.5 rounded-lg cursor-pointer transition-all flex items-center justify-between border ${isSelected
                      ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm"
                      : "bg-white text-gray-700 hover:bg-gray-50 border-transparent"
                    }`}
                >
                  <div>
                    <p className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                      {role.display_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!role.is_system && isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="p-1 hover:bg-red-500 rounded text-white/80 hover:text-white transition-colors"
                        title="Xóa vai trò này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix for Selected Role (Internal Scrollable) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-0 overflow-hidden">
          {selectedRole ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col h-full overflow-hidden">

              {/* Role Header Info (Fixed Top) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800">{selectedRole.display_name}</h2>
                  </div>
                  {selectedRole.description && (
                    <p className="text-xs text-gray-500 mt-1">{selectedRole.description}</p>
                  )}
                </div>

                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu Ma Trận Quyền
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-2 font-medium my-3 flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã cập nhật bảng phân quyền thành công!
                </div>
              )}

              {/* Permissions Matrix Grouped by Modules (Scrollable Body) */}
              <div className="space-y-6 overflow-y-auto flex-1 pr-2 pt-4">
                {Object.entries(groupedPermissions).map(([modName, modPerms]) => {
                  const modPermIds = modPerms.map(p => p.id);
                  const isAllSelected = modPermIds.every(id => rolePermissions.includes(id));

                  return (
                    <div key={modName} className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-xs uppercase tracking-wider text-gray-700">
                          {getModuleNameInVietnamese(modName)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleModulePermissions(modName, modPermIds)}
                          className="text-xs text-[var(--primary)] hover:underline font-semibold"
                        >
                          {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả module này"}
                        </button>
                      </div>

                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                        {modPerms.map(perm => {
                          const isChecked = rolePermissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${isChecked
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-gray-800'
                                  : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.id)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                              />
                              <div>
                                <p className="text-xs font-semibold">{perm.display_name}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-gray-100 text-center text-gray-400 h-full flex items-center justify-center">
              Vui lòng chọn một Vai trò ở bên trái để thiết lập quyền hạn.
            </div>
          )}
        </div>

      </div>

      {/* Modal Tạo Role Mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo vai trò mới"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Vai Trò (Tên hiển thị)</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Quản Lý Kho, Kế Toán, Nhân Viên Sales..."
              value={newRoleDisplayName}
              onChange={(e) => setNewRoleDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mô Tả Vai Trò</label>
            <textarea
              rows={3}
              placeholder="Mô tả trách nhiệm hoặc quyền hạn chính của vai trò này..."
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={modalSubmitting}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {modalSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo Vai Trò
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
