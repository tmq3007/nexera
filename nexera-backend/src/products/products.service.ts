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

  constructor(private readonly supabaseService: SupabaseService) { }

  // ===================== DANH MỤC (CATEGORIES) =====================

  async getCategories() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

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

    // Resolve categorySlug -> id trước để builder bên dưới đồng bộ (chạy lại được khi fallback)
    let resolvedCategoryId: string | null = query.categoryId || null;
    if (!resolvedCategoryId && query.categorySlug) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', query.categorySlug)
        .maybeSingle();
      resolvedCategoryId = cat?.id || null;
    }

    const groupByType = String(query.group_by_type) === 'true';

    /**
     * mode:
     *  - 'full'   : join brands + product_types, gom nhóm theo TÊN hãng -> TÊN loại
     *  - 'ids'    : join, gom nhóm theo brand_id -> product_type_id (nếu PostgREST không hỗ trợ order theo bảng liên kết)
     *  - 'legacy' : như cũ, không join (DB chưa chạy migration brands/product_types)
     */
    const buildQuery = (mode: 'full' | 'ids' | 'legacy') => {
    const selectStr =
      mode === 'legacy'
        ? '*, categories(id, name, slug)'
        : '*, categories(id, name, slug), brands(id, name, slug), product_types(id, name, slug)';

    let dbQuery = supabase
      .from('products')
      .select(selectStr, { count: 'exact' });

    // Lọc theo Category ID hoặc Category Slug
    if (resolvedCategoryId) {
      dbQuery = dbQuery.eq('category_id', resolvedCategoryId);
    }

    // Lọc theo Thương hiệu / Loại
    if (mode !== 'legacy') {
      if (query.brand_id) {
        dbQuery = query.brand_id === 'none'
          ? dbQuery.is('brand_id', null)
          : dbQuery.eq('brand_id', query.brand_id);
      }
      if (query.product_type_id) {
        dbQuery = query.product_type_id === 'none'
          ? dbQuery.is('product_type_id', null)
          : dbQuery.eq('product_type_id', query.product_type_id);
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
    } else if (String(query.bestseller) === 'false') {
      dbQuery = dbQuery.eq('is_bestseller', false);
    }

    // Lọc theo loại sản phẩm
    if (query.type) {
      dbQuery = dbQuery.eq('type', query.type);
    }

    // Lọc theo trạng thái hiển thị (is_active / isActive)
    const activeVal = query.is_active ?? query.isActive;
    if (activeVal !== undefined && activeVal !== null && activeVal !== '') {
      if (String(activeVal) === 'true') {
        dbQuery = dbQuery.eq('is_active', true);
      } else if (String(activeVal) === 'false') {
        dbQuery = dbQuery.eq('is_active', false);
      }
    }

    // Lọc theo trạng thái kho hàng (stock)
    if (query.stock === 'out_of_stock') {
      dbQuery = dbQuery.lte('stock', 0);
    } else if (query.stock === 'in_stock') {
      dbQuery = dbQuery.gt('stock', 0);
    }

    // Lọc theo khoảng giá (price_min / price_max)
    const minP = query.price_min ?? query.priceMin;
    if (minP !== undefined && minP !== null && minP !== '') {
      const numMin = Number(minP);
      if (!isNaN(numMin)) {
        dbQuery = dbQuery.gte('price', numMin);
      }
    }
    const maxP = query.price_max ?? query.priceMax;
    if (maxP !== undefined && maxP !== null && maxP !== '') {
      const numMax = Number(maxP);
      if (!isNaN(numMax)) {
        dbQuery = dbQuery.lte('price', numMax);
      }
    }

    // Sắp xếp linh hoạt (sort, sort_by, sortBy, sortOrder)
    const rawSort = String(query.sort_by || query.sort || query.sortBy || '').trim();
    let sortField = 'created_at';
    let ascending = false;

    if (rawSort.includes('|')) {
      const [field, dir] = rawSort.split('|');
      const validFields = ['price', 'stock', 'name', 'created_at', 'updated_at'];
      if (validFields.includes(field.trim())) {
        sortField = field.trim();
      }
      ascending = dir?.trim().toLowerCase() === 'asc';
    } else if (rawSort === 'price_asc') {
      sortField = 'price';
      ascending = true;
    } else if (rawSort === 'price_desc') {
      sortField = 'price';
      ascending = false;
    } else if (rawSort === 'stock_asc') {
      sortField = 'stock';
      ascending = true;
    } else if (rawSort === 'stock_desc') {
      sortField = 'stock';
      ascending = false;
    } else if (rawSort === 'name_asc') {
      sortField = 'name';
      ascending = true;
    } else if (rawSort === 'name_desc') {
      sortField = 'name';
      ascending = false;
    } else if (rawSort === 'oldest') {
      sortField = 'created_at';
      ascending = true;
    } else if (rawSort === 'newest') {
      sortField = 'created_at';
      ascending = false;
    }

    if (query.sortOrder) {
      ascending = String(query.sortOrder).toLowerCase() === 'asc';
    }

    // Gom nhóm: cùng Hãng -> cùng Loại luôn đứng liền nhau, sau đó mới sắp theo tiêu chí đã chọn
    if (groupByType && mode === 'full') {
      dbQuery = dbQuery
        .order('brands(name)', { ascending: true, nullsFirst: false })
        .order('brand_id', { ascending: true, nullsFirst: false })
        .order('product_types(name)', { ascending: true, nullsFirst: false })
        .order('product_type_id', { ascending: true, nullsFirst: false });
    } else if (groupByType && mode === 'ids') {
      dbQuery = dbQuery
        .order('brand_id', { ascending: true, nullsFirst: false })
        .order('product_type_id', { ascending: true, nullsFirst: false });
    }

    dbQuery = dbQuery.order(sortField, { ascending, nullsFirst: false });
    // Khóa phụ ổn định để phân trang không bị nhảy thứ tự
    if (sortField !== 'name') dbQuery = dbQuery.order('name', { ascending: true });

    return dbQuery.range(offset, offset + limit - 1);
    };

    let result = await buildQuery('full');
    if (result.error) {
      this.logger.warn(`Query sản phẩm (full) lỗi, thử fallback: ${result.error.message}`);
      result = await buildQuery('ids');
    }
    if (result.error) {
      this.logger.warn(`Query sản phẩm (ids) lỗi, dùng chế độ cũ: ${result.error.message}`);
      result = await buildQuery('legacy');
    }

    const { data, count, error } = result;

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
      sale_mode: d.sale_mode ?? d.saleMode ?? 'inherit',
      price_display: d.price_display ?? d.priceDisplay ?? 'show',
    };
    await this.applyBrandAndType(payload, dto);

    let { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error && this.isMissingTaxonomyColumn(error)) {
      this.stripTaxonomy(payload);
      ({ data, error } = await supabase.from('products').insert(payload).select().single());
    }

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
      sale_mode: d.sale_mode ?? d.saleMode ?? 'inherit',
      price_display: d.price_display ?? d.priceDisplay ?? 'show',
    };
    await this.applyBrandAndType(payload, dto);

    let { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error && this.isMissingTaxonomyColumn(error)) {
      this.stripTaxonomy(payload);
      ({ data, error } = await supabase.from('products').update(payload).eq('id', id).select().maybeSingle());
    }

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


  /**
   * Gán brand_id / product_type_id (chỉ khi client có gửi lên; null = gỡ).
   * - Có loại mà thiếu hãng -> tự lấy hãng của loại.
   * - Loại không thuộc hãng đã chọn -> báo lỗi.
   * - Đồng bộ cột text `brand` = tên hãng (giữ tìm kiếm & Storefront hoạt động như cũ).
   */
  private async applyBrandAndType(payload: any, dto: CreateProductDto) {
    const hasBrand = dto.brand_id !== undefined;
    const hasType = dto.product_type_id !== undefined;
    if (!hasBrand && !hasType) return;

    const supabase = this.supabaseService.getClient();
    let brandId: string | null | undefined = hasBrand ? dto.brand_id || null : undefined;
    const typeId: string | null | undefined = hasType ? dto.product_type_id || null : undefined;

    if (typeId) {
      const { data: t, error } = await supabase
        .from('product_types')
        .select('id, brand_id')
        .eq('id', typeId)
        .maybeSingle();
      if (error && this.isMissingTaxonomyColumn(error)) return; // DB chưa migrate
      if (!t) throw new BadRequestException('Loại sản phẩm không tồn tại');
      if (brandId && t.brand_id !== brandId) {
        throw new BadRequestException('Loại đã chọn không thuộc thương hiệu này');
      }
      if (!brandId) brandId = t.brand_id;
    }

    if (brandId !== undefined) {
      payload.brand_id = brandId;
      if (brandId) {
        const { data: b } = await supabase.from('brands').select('name').eq('id', brandId).maybeSingle();
        if (b?.name) payload.brand = b.name;
      }
      // brandId = null: giữ nguyên cột text `brand` client gửi lên (dữ liệu cũ chưa map được hãng)
    }
    if (typeId !== undefined) {
      payload.product_type_id = typeId;
    } else if (hasBrand && !brandId) {
      payload.product_type_id = null; // gỡ hãng thì gỡ luôn loại
    }
  }

  /** DB chưa chạy migration brands/product_types hoặc sale_mode */
  private isMissingTaxonomyColumn(error: any): boolean {
    const msg = `${error?.message || ''} ${error?.details || ''}`;
    return (
      error?.code === 'PGRST204' ||
      error?.code === 'PGRST205' ||
      error?.code === '42703' ||
      error?.code === '42P01' ||
      /brand_id|product_type_id|product_types|brands|sale_mode|price_display/.test(msg)
    );
  }

  private stripTaxonomy(payload: any) {
    delete payload.brand_id;
    delete payload.product_type_id;
    delete payload.sale_mode;
    delete payload.price_display;
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
    if (dto.sale_mode) {
      updatePayload.sale_mode = dto.sale_mode;
    }
    if (dto.price_display) {
      updatePayload.price_display = dto.price_display;
    }

    let { error } = await supabase
      .from('products')
      .update(updatePayload)
      .in('id', dto.ids);

    if (error && this.isMissingTaxonomyColumn(error)) {
      this.logger.warn('Cột sale_mode chưa có trong DB. Bỏ qua cập nhật sale_mode.');
      delete updatePayload.sale_mode;
      delete updatePayload.price_display;
      if (Object.keys(updatePayload).length > 0) {
        ({ error } = await supabase.from('products').update(updatePayload).in('id', dto.ids));
      } else {
        error = null;
      }
    }

    if (error) {
      throw new BadRequestException(`Lỗi cập nhật hàng loạt: ${error.message}`);
    }

    return { success: true, count: dto.ids.length };
  }
}

