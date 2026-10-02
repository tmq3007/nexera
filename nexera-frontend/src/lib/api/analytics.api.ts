import { api } from './client';

export interface DashboardOverviewData {
  productCount: number;
  orderCount: number;
  pendingOrderCount: number;
  leadCount: number;
  newLeadCount: number;
  articleCount: number;
  projectCount: number;
  customerCount: number;
  lowStockCount: number;
  totalRevenue: number;
  recentOrders: Array<{
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    customers?: {
      full_name: string;
      phone: string;
    };
  }>;
  recentLeads: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    status: string;
    message: string;
    created_at: string;
  }>;
  recentProducts: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    images?: string[];
  }>;
  chartDays: Array<{
    day: string;
    amount: number;
  }>;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any>;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ip_address?: string;
  created_at: string;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetActivityLogsQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  entityType?: string;
  severity?: string;
}

export const analyticsApi = {
  getDashboardOverview: (token: string) =>
    api.get<DashboardOverviewData | null>('/analytics/dashboard-overview', {
      token,
      revalidate: false,
    }),

  logActivity: (data: {
    userId?: string;
    userEmail?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    severity?: "INFO" | "WARNING" | "CRITICAL";
    ipAddress?: string;
  }, token: string) =>
    api.post<void>('/analytics/activity-logs', data, { token }).then(() => true),

  getActivityLogs: (query: GetActivityLogsQuery = {}, token: string) =>
    api.get<ActivityLogsResponse>('/analytics/activity-logs', {
      params: query as Record<string, string | number | boolean | undefined>,
      token,
      revalidate: false,
    }),
};
