"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { rbacApi, Role, AdminAccount } from "@/lib/api/rbac.api";
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Users,
  AlertCircle,
  Plus,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";

export default function AdminAccountsPage() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State - Add New Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Role Modal State
  const [editAdmin, setEditAdmin] = useState<AdminAccount | null>(null);
  const [editRoleId, setEditRoleId] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

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
      const permCheck = await rbacApi.checkPermission(user.id, "admin.manage_users");
      setHasPermission(permCheck.hasPermission);

      if (!permCheck.hasPermission) {
        setLoading(false);
        return;
      }

      // 2. Tải danh sách Roles & Admin accounts nếu có quyền
      const [rolesData, adminData] = await Promise.all([
        rbacApi.getRoles(),
        rbacApi.getAdminAccounts(),
      ]);

      setRoles(rolesData);
      if (rolesData.length > 0) setNewRoleId(rolesData[0].id);
      setAdmins(adminData);
    } catch (err: any) {
      console.error("Lỗi khi kiểm tra quyền và tải dữ liệu admin:", err);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPermissionAndFetchData();
  }, []);

  // Toggle Active Status
  const handleToggleActive = async (admin: AdminAccount) => {
    const confirmMsg = admin.is_active 
      ? `Bạn có chắc muốn TẠM KHÓA tài khoản ${admin.display_name}?` 
      : `MỞ KHÓA tài khoản ${admin.display_name}?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const updated = await rbacApi.toggleAdminActive(admin.id);
      if (updated) {
        setAdmins(admins.map(a => a.id === admin.id ? { ...a, is_active: updated.is_active } : a));
      }
    } catch (err: any) {
      alert("Không thể cập nhật trạng thái: " + err.message);
    }
  };

  // Create Admin Account
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      await rbacApi.createAdminAccount({
        email: newEmail,
        password: newPassword,
        displayName: newDisplayName,
        roleId: newRoleId,
      });

      setNewEmail("");
      setNewPassword("");
      setNewDisplayName("");
      await checkPermissionAndFetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Đã xảy ra lỗi khi tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  // Update Role
  const handleSaveRole = async () => {
    if (!editAdmin) return;
    setUpdatingRole(true);
    try {
      await rbacApi.updateAdminRole(editAdmin.id, editRoleId);

      await checkPermissionAndFetchData();
      setEditAdmin(null);
    } catch (err: any) {
      alert("Cập nhật vai trò thất bại: " + err.message);
    } finally {
      setUpdatingRole(false);
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

  // Access Denied Screen if user lacks permission `admin.manage_users`
  if (hasPermission === false) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Bạn Không Có Quyền Truy Cập</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Tính năng <strong>"Quản lý tài khoản"</strong> yêu cầu quyền <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">admin.manage_users</code> hoặc vai trò Quản trị viên cấp cao (Super Admin). Vui lòng liên hệ quản trị viên để được cấp quyền.
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

  const filteredAdmins = admins.filter(a => 
    a.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.roles?.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Quản Lý Tài Khoản</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý danh sách tài khoản và phân quyền hệ thống NEXERA
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tạo tài khoản
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Tổng số tài khoản</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{admins.length}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {admins.filter(a => a.is_active).length}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Đã tạm khóa</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {admins.filter(a => !a.is_active).length}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hiển thị hoặc vai trò..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Admin Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Tên Hiển Thị</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Vai Trò (Role)</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Trạng Thái</th>
                <th className="text-left px-6 py-3.5 font-semibold text-gray-600">Ngày Tạo</th>
                <th className="text-center px-6 py-3.5 font-semibold text-gray-600">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <p>Không tìm thấy tài khoản nào.</p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-semibold flex items-center justify-center text-sm">
                          {admin.display_name?.[0]?.toUpperCase() || "A"}
                        </div>
                        <div>
                          <span className="font-medium text-gray-800 block">{admin.display_name}</span>
                          <span className="text-xs text-gray-400 font-mono">ID: {admin.auth_user_id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold ${
                        admin.roles?.name === 'super_admin' 
                          ? 'text-purple-700'
                          : 'text-blue-600'
                      }`}>
                        {admin.roles?.display_name || "Chưa phân role"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-semibold ${admin.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {admin.is_active ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(admin.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => {
                          setEditAdmin(admin);
                          setEditRoleId(admin.role_id);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-[var(--accent)] hover:text-white text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        title="Đổi vai trò"
                      >
                        Đổi vai trò
                      </button>

                      <button
                        onClick={() => handleToggleActive(admin)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          admin.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                            : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                        }`}
                      >
                        {admin.is_active ? "Tạm khóa" : "Kích hoạt"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tạo Admin Mới */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tạo tài khoản mới"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tên Hiển Thị</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Nguyễn Văn Quản Trị"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Đăng Nhập</label>
            <input
              type="email"
              required
              placeholder="user@nexera.vn"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Mật Khẩu</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Gán Vai Trò (Role)</label>
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm bg-white"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.display_name} ({r.name})
                </option>
              ))}
            </select>
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
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Sửa Role */}
      <Modal
        isOpen={!!editAdmin}
        onClose={() => setEditAdmin(null)}
        title="Đổi vai trò tài khoản"
        maxWidth="max-w-sm"
      >
        {editAdmin && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Gán lại quyền hạn cho: <strong className="text-gray-800">{editAdmin.display_name}</strong></p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Chọn Vai Trò Mới</label>
              <select
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[var(--primary)] focus:outline-none text-sm bg-white"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.display_name} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditAdmin(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRole}
                disabled={updatingRole}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {updatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
