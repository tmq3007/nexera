import { IsNotEmpty, IsOptional, IsString, IsArray, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SyncCustomerProfileDto {
  @IsString()
  @IsNotEmpty()
  authUserId: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  guestSessionId?: string;

  @IsString()
  @IsOptional()
  guestPhone?: string;

  @IsString()
  @IsOptional()
  guestEmail?: string;
}

export class UpdateCustomerProfileDto {
  @IsString()
  @IsOptional()
  full_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsOptional()
  phone_numbers?: string[];

  @IsArray()
  @IsOptional()
  emails?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  tier?: string;
}

export class AddCustomerCrmNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  adminId?: string;

  @IsString()
  @IsOptional()
  authorName?: string;
}

export class UpdateCustomerTierDto {
  @IsString()
  @IsNotEmpty()
  tier: string;
}

export class GetCustomersQueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
