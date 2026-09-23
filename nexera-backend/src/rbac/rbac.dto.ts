import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

export class CreateAdminAccountDto {
  @IsString()
  email: string;

  @IsString()
  password: string;

  @IsString()
  displayName: string;

  @IsString()
  roleId: string;
}

export class UpdateAdminRoleDto {
  @IsString()
  roleId: string;
}
