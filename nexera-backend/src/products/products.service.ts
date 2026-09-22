import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  GetProductsQueryDto,
  CreateProductDto,
  UpdateProductDto,
  BulkUpdateProductsDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './products.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  // ===================== DANH MỤC (CATEGORIES) =====================

  async getCategories() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Lỗi lấy danh mục:', error);
      return [];
    }
    return data || [];
  }

  async getCategoryByIdOrSlug(idOrSlug: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const query = supabase.from('categories').select('*');
    if (isUuid) {
      query.eq('id', idOrSlug);
    } else {
      query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return data;
  }

  async createCategory(dto: CreateCategoryDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        image_url: dto.imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo danh mục:', error);
      throw new BadRequestException(`Không thể tạo danh mục: ${error.message}`);
    }
    return data;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        image_url: dto.imageUrl || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi cập nhật danh mục:', error);
      throw new BadRequestException(`Không thể cập nhật danh mục: ${error.message}`);
    }
    return data;
  }

  async deleteCategory(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      this.logger.error('Lỗi xóa danh mục:', error);
      throw new BadRequestException(`Không thể xóa danh mục: ${error.message}`);
    }
    return { success: true };
  }

  // ===================== SẢN PHẨM (PRODUCTS) =====================

  async getProducts(query: GetProductsQueryDto) {
    const supabase = this.supabaseService.getClient();
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('products')
      .select('*, categories(id, name, slug)', { count: 'exact' });

    // Lọc theo Category ID hoặc Category Slug
    if (query.categoryId) {
      dbQuery = dbQuery.eq('category_id', query.categoryId);
    } else if (query.categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', query.categorySlug)
        .maybeSingle();

      if (cat) {
        dbQuery = dbQuery.eq('category_id', cat.id);
      }
    }

    // Lọc tìm kiếm từ khóa
    if (query.search) {
      const q = query.search.trim();
      dbQuery = dbQuery.or(`name.ilike.%${q}%,sku.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    // Lọc bán chạy
    if (String(query.bestseller) === 'true') {
      dbQuery = dbQuery.eq('is_bestseller', true);
    }

    // Lọc theo loại sản phẩm
    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    // Sắp xếp
    if (query.sort === 'price_asc') {
      dbQuery = dbQuery.order('price', { ascending: true });
    } else if (query.sort === 'price_desc') {
      dbQuery = dbQuery.order('price', { ascending: false });
    } else if (query.sort === 'oldest') {
      dbQuery = dbQuery.order('created_at', { ascending: true });
    } else {
      // Mặc định mới nhất
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      this.logger.error('Lỗi lấy danh sách sản phẩm:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
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

  async getBestsellers(limitCount = 8) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('is_active', true)
      .eq('is_bestseller', true)
      .order('created_at', { ascending: false })
      .limit(limitCount);

    if (error) {
      this.logger.error('Lỗi lấy danh sách sản phẩm bán chạy:', error);
      // Fallback lấy sản phẩm mới nhất
      const { data: fallbackData } = await supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limitCount);

      return fallbackData || [];
    }

    return data || [];
  }

  async getProductDetail(slugOrId: string) {
    const supabase = this.supabaseService.getClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const query = supabase
      .from('products')
      .select('*, categories(id, name, slug)');

    if (isUuid) {
      query.eq('id', slugOrId);
    } else {
      query.eq('slug', slugOrId);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    return data;
  }

  async createProduct(dto: CreateProductDto) {
    const supabase = this.supabaseService.getClient();
    const d = dto as any; // Hỗ trợ cả camelCase lẫn snake_case từ Frontend
    const payload = {
      name: dto.name,
      slug: dto.slug,
      category_id: dto.categoryId || d.category_id || null,
      description: dto.description || null,
      price: dto.price ?? 0,
      import_price: dto.importPrice ?? d.import_price ?? 0,
      discount_rate: dto.discountRate ?? d.discount_rate ?? 0,
      stock: dto.stock ?? 0,
      type: dto.type || 'EQUIPMENT',
      image_url: dto.imageUrl || d.image_url || (dto.images && dto.images[0]) || null,
      images: dto.images || [],
      gallery: d.gallery || [],
      sku: dto.sku || null,
      brand: dto.brand || null,
      supplier: dto.supplier || null,
      origin: dto.origin || null,
      warranty_info: dto.warrantyInfo || d.warranty_info || null,
      specifications: dto.specifications || {},
      is_active: dto.isActive ?? d.is_active ?? true,
      is_bestseller: dto.isBestseller ?? d.is_bestseller ?? false,
      restock_date: d.restock_date || null,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo sản phẩm:', error);
      throw new BadRequestException(`Không thể tạo sản phẩm: ${error.message}`);
    }

    return data;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const supabase = this.supabaseService.getClient();
    const d = dto as any;
    const payload: any = {
      name: dto.name,
      slug: dto.slug,
      category_id: dto.categoryId || d.category_id || null,
      description: dto.description || null,
      price: dto.price ?? 0,
      import_price: dto.importPrice ?? d.import_price ?? 0,
      discount_rate: dto.discountRate ?? d.discount_rate ?? 0,
      stock: dto.stock ?? 0,
      type: dto.type || 'EQUIPMENT',
      image_url: dto.imageUrl || d.image_url || (dto.images && dto.images[0]) || null,
      images: dto.images || [],
      gallery: d.gallery || [],
      sku: dto.sku || null,
      brand: dto.brand || null,
      supplier: dto.supplier || null,
      origin: dto.origin || null,
      warranty_info: dto.warrantyInfo || d.warranty_info || null,
      specifications: dto.specifications || {},
      is_active: dto.isActive ?? d.is_active ?? true,
      is_bestseller: dto.isBestseller ?? d.is_bestseller ?? false,
      restock_date: d.restock_date || null,
    };

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error('Lỗi cập nhật sản phẩm:', error);
      throw new BadRequestException(`Không thể cập nhật sản phẩm: ${error.message}`);
    }

    if (!data) {
      this.logger.error(
        `Không thể cập nhật sản phẩm id=${id}. Có thể do SUPABASE_SERVICE_ROLE_KEY trong .env đang là key 'anon' nên bị RLS chặn quyền ghi.`,
      );
      throw new BadRequestException(
        'Không thể lưu sản phẩm. Vui lòng kiểm tra lại SUPABASE_SERVICE_ROLE_KEY trong .env (hiện đang dùng key anon nên bị RLS chặn).',
      );
    }

    return data;
  }

  async deleteProduct(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      this.logger.error('Lỗi xóa sản phẩm:', error);
      throw new BadRequestException(`Không thể xóa sản phẩm: ${error.message}`);
    }

    return { success: true };
  }

  async bulkUpdateProducts(dto: BulkUpdateProductsDto) {
    if (!dto.ids || dto.ids.length === 0) {
      throw new BadRequestException('Danh sách ID sản phẩm không được rỗng.');
    }

    const supabase = this.supabaseService.getClient();

    if (dto.action === 'delete') {
      const { error } = await supabase.from('products').delete().in('id', dto.ids);
      if (error) throw new BadRequestException(`Lỗi xóa hàng loạt: ${error.message}`);
      return { success: true, count: dto.ids.length };
    }

    const updatePayload: any = {};

    if (dto.isActive !== undefined) {
      updatePayload.is_active = dto.isActive;
    }
    if (dto.isBestseller !== undefined) {
      updatePayload.is_bestseller = dto.isBestseller;
    }
    if (dto.categoryId) {
      updatePayload.category_id = dto.categoryId;
    }

    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .in('id', dto.ids);

    if (error) {
      throw new BadRequestException(`Lỗi cập nhật hàng loạt: ${error.message}`);
    }

    return { success: true, count: dto.ids.length };
  }
}
