import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GetProjectsQueryDto, CreateProjectDto, UpdateProjectDto } from './content.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getProjects(query: GetProjectsQueryDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('projects')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query.category && query.category !== 'all') {
      dbQuery = dbQuery.eq('category', query.category);
    }

    if (query.search) {
      const q = query.search.trim();
      dbQuery = dbQuery.ilike('name', `%${q}%`);
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách dự án:', error);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }

    const total = count || 0;
    return {
      data: data || [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProjectByIdOrSlug(idOrSlug: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const query = supabase.from('projects').select('*');
    if (isUuid) {
      query.eq('id', idOrSlug);
    } else {
      query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Không tìm thấy dự án tương ứng.');
    }

    return data;
  }

  async createProject(dto: CreateProjectDto) {
    const supabase = this.supabaseService.getClient();
    const payload = {
      name: dto.name,
      slug: dto.slug || null,
      category: dto.category,
      description: dto.description || null,
      image_url: dto.imageUrl || null,
      completion_date: dto.completionDate || null,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo dự án:', error);
      throw new BadRequestException(`Không thể tạo dự án: ${error.message}`);
    }

    return data;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const supabase = this.supabaseService.getClient();
    const payload = {
      name: dto.name,
      slug: dto.slug || null,
      category: dto.category,
      description: dto.description || null,
      image_url: dto.imageUrl || null,
      completion_date: dto.completionDate || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi cập nhật dự án:', error);
      throw new BadRequestException(`Không thể cập nhật dự án: ${error.message}`);
    }

    return data;
  }

  async deleteProject(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('projects').delete().eq('id', id);

    if (error) {
      this.logger.error('Lỗi xóa dự án:', error);
      throw new BadRequestException(`Không thể xóa dự án: ${error.message}`);
    }

    return { success: true };
  }
}
