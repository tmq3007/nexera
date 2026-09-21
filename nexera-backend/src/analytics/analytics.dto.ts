export class CreateActivityLogDto {
  userId?: string;
  userEmail?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  ipAddress?: string;
}

export class QueryActivityLogsDto {
  page?: number;
  pageSize?: number;
  q?: string;
  entityType?: string;
  severity?: string;
}
