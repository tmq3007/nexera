import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GetArticlesQueryDto, CreateArticleDto, UpdateArticleDto } from './content.dto';

@Injectable()
export class ArticlesService {
  private readonly logger = new Logger(ArticlesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getArticles(query: GetArticlesQueryDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false });

    if (query.type && query.type !== 'ALL') {
      dbQuery = dbQuery.eq('type', query.type);
    }

    if (query.search) {
      const q = query.search.trim();
      dbQuery = dbQuery.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách bài viết:', error);
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

  async getArticleByIdOrSlug(idOrSlug: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const query = supabase.from('articles').select('*');
    if (isUuid) {
      query.eq('id', idOrSlug);
    } else {
      query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Không tìm thấy bài viết tương ứng.');
    }

    return data;
  }

  async createArticle(dto: CreateArticleDto) {
    const supabase = this.supabaseService.getClient();
    const payload = {
      title: dto.title,
      slug: dto.slug,
      type: dto.type || 'NEXERA',
      content: dto.content || null,
      image_url: dto.imageUrl || null,
      published_at: dto.publishedAt || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo bài viết:', error);
      throw new BadRequestException(`Không thể tạo bài viết: ${error.message}`);
    }

    return data;
  }

  async updateArticle(id: string, dto: UpdateArticleDto) {
    const supabase = this.supabaseService.getClient();
    const payload = {
      title: dto.title,
      slug: dto.slug,
      type: dto.type || 'NEXERA',
      content: dto.content || null,
      image_url: dto.imageUrl || null,
      published_at: dto.publishedAt || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('articles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi cập nhật bài viết:', error);
      throw new BadRequestException(`Không thể cập nhật bài viết: ${error.message}`);
    }

    return data;
  }

  async deleteArticle(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('articles').delete().eq('id', id);

    if (error) {
      this.logger.error('Lỗi xóa bài viết:', error);
      throw new BadRequestException(`Không thể xóa bài viết: ${error.message}`);
    }

    return { success: true };
  }
}
