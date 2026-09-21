import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import {
  CreateRoleDto,
  UpdateRolePermissionsDto,
  CreateAdminAccountDto,
  UpdateAdminRoleDto,
} from './rbac.dto';

@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('check-permission')
  async checkPermission(
    @Query('authUserId') authUserId: string,
    @Query('permission') permission?: string,
  ) {
    return this.rbacService.checkPermission(authUserId, permission);
  }

  // ----------------- ROLES -----------------
  @Get('roles')
  async getRoles() {
    return this.rbacService.getRoles();
  }

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rbacService.createRole(dto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }

  // ----------------- PERMISSIONS -----------------
  @Get('permissions')
  async getPermissions() {
    return this.rbacService.getPermissions();
  }

  @Get('roles/:id/permissions')
  async getRolePermissions(@Param('id') id: string) {
    return this.rbacService.getRolePermissions(id);
  }

  @Put('roles/:id/permissions')
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rbacService.updateRolePermissions(id, dto);
  }

  // ----------------- ADMIN ACCOUNTS -----------------
  @Get('admin-accounts')
  async getAdminAccounts() {
    return this.rbacService.getAdminAccounts();
  }

  @Post('admin-accounts')
  async createAdminAccount(@Body() dto: CreateAdminAccountDto) {
    return this.rbacService.createAdminAccount(dto);
  }

  @Patch('admin-accounts/:id/toggle-active')
  async toggleAdminActive(
    @Param('id') id: string,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.rbacService.toggleAdminActive(id, isActive);
  }

  @Patch('admin-accounts/:id/role')
  async updateAdminRole(
    @Param('id') id: string,
    @Body() dto: UpdateAdminRoleDto,
  ) {
    return this.rbacService.updateAdminRole(id, dto);
  }
}
