export class CreateRoleDto {
  name?: string;
  displayName: string;
  description?: string;
}

export class UpdateRolePermissionsDto {
  permissionIds: string[];
}

export class CreateAdminAccountDto {
  email: string;
  password: string;
  displayName: string;
  roleId: string;
}

export class UpdateAdminRoleDto {
  roleId: string;
}
