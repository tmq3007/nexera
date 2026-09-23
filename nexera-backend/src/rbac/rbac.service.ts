import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import {
  CreateRoleDto,
  UpdateRolePermissionsDto,
  CreateAdminAccountDto,
  UpdateAdminRoleDto,
} from './rbac.dto';

const slugify = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u066f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');
};

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ----------------- CHECK PERMISSION -----------------
  async checkPermission(authUserId: string, permissionName?: string) {
    const supabase = this.supabaseService.getClient();

    const { data: currentAdmin, error: adminErr } = await supabase
      .from('admin_accounts')
      .select('id, role_id, is_active, roles(name)')
      .eq('id', authUserId)
      .maybeSingle();

    if (adminErr || !currentAdmin || !currentAdmin.is_active) {
      return {
        hasPermission: false,
        isSuperAdmin: false,
        isActive: false,
        permissions: [],
      };
    }

    const isSuperAdmin = (currentAdmin.roles as any)?.name?.toLowerCase() === 'super_admin';



    const { data: rpData } = await supabase
      .from('role_permissions')
      .select('permissions(name)')
      .eq('role_id', currentAdmin.role_id);

    const perms = (rpData || [])
      .map((item: any) => item.permissions?.name)
      .filter(Boolean);

    const hasPermission = permissionName ? perms.includes(permissionName) : true;

    return {
      hasPermission,
      isSuperAdmin: false,
      isActive: true,
      permissions: perms,
    };
  }

  // ----------------- ROLES -----------------
  async getRoles() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('is_system', { ascending: false });

    if (error) {
      this.logger.error('Lỗi lấy danh sách Roles:', error);
      return [];
    }

    return data || [];
  }

  async createRole(dto: CreateRoleDto) {
    const supabase = this.supabaseService.getClient();
    const slug = dto.name || slugify(dto.displayName || '') || `role_${Date.now()}`;

    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: slug,
        display_name: (dto.displayName || '').trim(),
        description: dto.description || null,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Không thể tạo vai trò: ${error.message}`);
    }

    return data;
  }

  async deleteRole(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data: role } = await supabase
      .from('roles')
      .select('is_system')
      .eq('id', id)
      .single();

    if (role?.is_system) {
      throw new BadRequestException('Không thể xóa vai trò mặc định của hệ thống!');
    }

    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
      throw new BadRequestException(`Lỗi khi xóa vai trò: ${error.message}`);
    }

    return { success: true };
  }

  // ----------------- PERMISSIONS -----------------
  async getPermissions() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true });

    if (error) {
      this.logger.error('Lỗi lấy permissions:', error);
      return [];
    }

    return data || [];
  }

  async getRolePermissions(roleId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);

    if (error) {
      this.logger.error('Lỗi lấy role permissions:', error);
      return [];
    }

    return (data || []).map((r) => r.permission_id);
  }

  async updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto) {
    const supabase = this.supabaseService.getClient();

    this.logger.log(`[updateRolePermissions] roleId: ${roleId}, permissionIds count: ${dto.permissionIds?.length}`);

    // Xóa phân quyền cũ
    const { error: deleteError } = await supabase.from('role_permissions').delete().eq('role_id', roleId);
    if (deleteError) {
      this.logger.error('[updateRolePermissions] Delete error:', deleteError);
    }

    // Chèn mới
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      const rows = dto.permissionIds.map((permId) => ({
        role_id: roleId,
        permission_id: permId,
      }));

      const { data: insertedData, error } = await supabase.from('role_permissions').insert(rows).select();
      if (error) {
        this.logger.error('[updateRolePermissions] Insert error:', error);
        throw new BadRequestException(`Lỗi lưu phân quyền: ${error.message}`);
      }
      this.logger.log(`[updateRolePermissions] Inserted ${insertedData?.length} rows`);
    }

    // Verify
    const { data: verifyData } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .eq('role_id', roleId);
    this.logger.log(`[updateRolePermissions] Verify: ${verifyData?.length} permissions in DB for role ${roleId}`);

    return { success: true };
  }

  // ----------------- ADMIN ACCOUNTS -----------------
  async getAdminAccounts() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('*, roles(id, name, display_name)')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi lấy danh sách admin accounts:', error);
      return [];
    }

    return data || [];
  }

  async createAdminAccount(dto: CreateAdminAccountDto) {
    const supabase = this.supabaseService.getClient();

    // Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(dto.password, 10);

    const { data: adminAccount, error: insertError } = await supabase
      .from('admin_accounts')
      .insert({
        email: dto.email,
        password_hash: password_hash,
        display_name: dto.displayName,
        role_id: dto.roleId,
        is_active: true,
      })
      .select('*, roles(id, name, display_name)')
      .single();

    if (insertError) {
      throw new BadRequestException(`Không thể tạo hồ sơ Admin: ${insertError.message}`);
    }

    return adminAccount;
  }

  async toggleAdminActive(id: string, targetActive?: boolean) {
    const supabase = this.supabaseService.getClient();

    let newStatus = targetActive;
    if (newStatus === undefined) {
      const { data: current } = await supabase
        .from('admin_accounts')
        .select('is_active')
        .eq('id', id)
        .single();
      newStatus = !current?.is_active;
    }

    const { data, error } = await supabase
      .from('admin_accounts')
      .update({ is_active: newStatus })
      .eq('id', id)
      .select('*, roles(id, name, display_name)')
      .single();

    if (error) {
      throw new BadRequestException(`Không thể cập nhật trạng thái: ${error.message}`);
    }

    return data;
  }

  async updateAdminRole(id: string, dto: UpdateAdminRoleDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('admin_accounts')
      .update({ role_id: dto.roleId })
      .eq('id', id)
      .select('*, roles(id, name, display_name)')
      .single();

    if (error) {
      throw new BadRequestException(`Không thể đổi vai trò: ${error.message}`);
    }

    return data;
  }
}
