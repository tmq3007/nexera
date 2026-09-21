import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateActivityLogDto, QueryActivityLogsDto } from './analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getDashboardOverview() {
    const supabase = this.supabaseService.getClient();

    try {
      const [
        { count: productCount },
        { count: orderCount },
        { count: pendingOrderCount },
        { count: leadCount },
        { count: newLeadCount },
        { count: articleCount },
        { count: projectCount },
        { count: customerCount },
        { count: lowStockCount },
        { data: recentOrders },
        { data: recentLeads },
        { data: paidOrders },
        { data: recentProducts },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
        supabase.from('articles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }).lte('stock', 5),
        supabase
          .from('orders')
          .select('id, status, total_amount, created_at, customers(full_name, phone)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('leads')
          .select('id, name, phone, email, status, message, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('orders')
          .select('total_amount')
          .in('status', ['PAID', 'COMPLETED']),
        supabase
          .from('products')
          .select('id, name, price, stock, images')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const totalRevenue =
        paidOrders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) ?? 0;

      const chartDays = [
        { day: 'T2', amount: totalRevenue * 0.08 },
        { day: 'T3', amount: totalRevenue * 0.12 },
        { day: 'T4', amount: totalRevenue * 0.15 },
        { day: 'T5', amount: totalRevenue * 0.10 },
        { day: 'T6', amount: totalRevenue * 0.22 },
        { day: 'T7', amount: totalRevenue * 0.18 },
        { day: 'CN', amount: totalRevenue * 0.15 },
      ];

      return {
        productCount: productCount || 0,
        orderCount: orderCount || 0,
        pendingOrderCount: pendingOrderCount || 0,
        leadCount: leadCount || 0,
        newLeadCount: newLeadCount || 0,
        articleCount: articleCount || 0,
        projectCount: projectCount || 0,
        customerCount: customerCount || 0,
        lowStockCount: lowStockCount || 0,
        totalRevenue,
        recentOrders: recentOrders || [],
        recentLeads: recentLeads || [],
        recentProducts: recentProducts || [],
        chartDays,
      };
    } catch (err: any) {
      this.logger.error('Lỗi khi lấy dữ liệu Dashboard Overview:', err);
      throw new BadRequestException('Không thể tải thống kê bảng điều khiển.');
    }
  }

  async logActivity(dto: CreateActivityLogDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.from('activity_logs').insert([
      {
        user_id: dto.userId || null,
        user_email: dto.userEmail || null,
        action: dto.action,
        entity_type: dto.entityType || null,
        entity_id: dto.entityId || null,
        details: dto.details || {},
        severity: dto.severity || 'INFO',
        ip_address: dto.ipAddress || null,
      },
    ]).select().single();

    if (error) {
      this.logger.error('Lỗi lưu nhật ký hoạt động:', error);
      return null;
    }

    return data;
  }

  async getActivityLogs(query: QueryActivityLogsDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 15);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let dbQuery = supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (query.q) {
      const q = query.q.trim();
      dbQuery = dbQuery.or(
        `action.ilike.%${q}%,user_email.ilike.%${q}%,entity_id.ilike.%${q}%`,
      );
    }

    if (query.entityType && query.entityType !== 'all') {
      dbQuery = dbQuery.eq('entity_type', query.entityType);
    }

    if (query.severity && query.severity !== 'all') {
      dbQuery = dbQuery.eq('severity', query.severity);
    }

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách nhật ký:', error);
      return { logs: [], total: 0, page, pageSize, totalPages: 0 };
    }

    const total = count || 0;
    return {
      logs: data || [],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
