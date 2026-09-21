const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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

export const analyticsApi = {
  async getDashboardOverview(): Promise<DashboardOverviewData | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/analytics/dashboard-overview`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getDashboardOverview:", err);
      return null;
    }
  },

  async logActivity(data: {
    userId?: string;
    userEmail?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: Record<string, any>;
    severity?: "INFO" | "WARNING" | "CRITICAL";
    ipAddress?: string;
  }): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/analytics/activity-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi logActivity:", err);
      return false;
    }
  },

  async getActivityLogs(query: {
    page?: number;
    pageSize?: number;
    q?: string;
    entityType?: string;
    severity?: string;
  } = {}): Promise<ActivityLogsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set("page", query.page.toString());
      if (query.pageSize) params.set("pageSize", query.pageSize.toString());
      if (query.q) params.set("q", query.q);
      if (query.entityType) params.set("entityType", query.entityType);
      if (query.severity) params.set("severity", query.severity);

      const res = await fetch(`${BACKEND_URL}/analytics/activity-logs?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return { logs: [], total: 0, page: 1, pageSize: 15, totalPages: 0 };
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi getActivityLogs:", err);
      return { logs: [], total: 0, page: 1, pageSize: 15, totalPages: 0 };
    }
  },
};
