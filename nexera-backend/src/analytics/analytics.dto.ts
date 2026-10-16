import { IsString, IsOptional } from 'class-validator';

export class CreateActivityLogDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userEmail?: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  details?: Record<string, any>;

  @IsOptional()
  @IsString()
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class QueryActivityLogsDto {
  @IsOptional()
  page?: number | string;

  @IsOptional()
  pageSize?: number | string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  severity?: string;

  @IsOptional()
  @IsString()
  date?: string;
}
