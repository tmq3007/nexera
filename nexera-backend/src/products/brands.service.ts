import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateProductTypeDto,
  UpdateProductTypeDto,
} from './products.dto';

/**
 * Quản lý Thương hiệu (brands) và Loại sản phẩm theo Thương hiệu (product_types).
 * Phân cấp: Thương hiệu -> Loại -> Sản phẩm. Danh mục (categories) độc lập.
 */
@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  static toSlug(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private extractCount(row: any): number {
    return Array.isArray(row?.products) ? (row.products[0]?.count ?? 0) : 0;
  }

  // ===================== THƯƠNG HIỆU =====================

  /** Danh sách thương hiệu kèm số sản phẩm. Trả [] nếu DB chưa chạy migration. */
  async getBrands() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*, products(count)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      this.logger.warn(`Không lấy được thương hiệu: ${error.message}`);
      return [];
    }
    return (data || []).map(({ products, ...b }: any) => ({
      ...b,
      product_count: this.extractCount({ products }),
    }));
  }

  async getBrandById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('brands').select('*').eq('id', id).maybeSingle();
    return data;
  }

  async createBrand(dto: CreateBrandDto) {
    const name = (dto.name || '').trim();
    if (!name) throw new BadRequestException('Tên thương hiệu không được để trống');

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('brands')
      .insert({ name, slug: BrandsService.toSlug(name), sort_order: dto.sort_order ?? 0 })
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo thương hiệu:', error);
      if (error.code === '23505') throw new BadRequestException(`Thương hiệu "${name}" đã tồn tại`);
      throw new BadRequestException(`Không thể tạo thương hiệu: ${error.message}`);
    }
    return { ...data, product_count: 0 };
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const payload: any = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Tên thương hiệu không được để trống');
      payload.name = name;
      payload.slug = BrandsService.toSlug(name);
    }
    if (dto.sort_order !== undefined) payload.sort_order = dto.sort_order;

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('brands')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error('Lỗi cập nhật thương hiệu:', error);
      if (error.code === '23505') throw new BadRequestException('Tên thương hiệu này đã tồn tại');
      throw new BadRequestException(`Không thể cập nhật thương hiệu: ${error.message}`);
    }
    if (!data) throw new NotFoundException('Không tìm thấy thương hiệu');

    // Đồng bộ cột text products.brand (dùng cho tìm kiếm & Storefront)
    if (payload.name) {
      await supabase.from('products').update({ brand: payload.name }).eq('brand_id', id);
    }
    return data;
  }

  /** Xóa thương hiệu: các Loại của hãng bị xóa theo; sản phẩm KHÔNG bị xóa, chỉ bị gỡ hãng/loại. */
  async deleteBrand(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) {
      this.logger.error('Lỗi xóa thương hiệu:', error);
      throw new BadRequestException(`Không thể xóa thương hiệu: ${error.message}`);
    }
    return { success: true };
  }

  // ===================== LOẠI SẢN PHẨM (thuộc Thương hiệu) =====================

  async getProductTypes(brandId?: string) {
    const supabase = this.supabaseService.getClient();
    let q = supabase
      .from('product_types')
      .select('*, products(count)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (brandId) q = q.eq('brand_id', brandId);

    const { data, error } = await q;
    if (error) {
      this.logger.warn(`Không lấy được loại sản phẩm: ${error.message}`);
      return [];
    }
    return (data || []).map(({ products, ...t }: any) => ({
      ...t,
      product_count: this.extractCount({ products }),
    }));
  }

  async getProductTypeById(id: string) {
    const supabase = this.supabaseService.getClient();
    const { data } = await supabase.from('product_types').select('*').eq('id', id).maybeSingle();
    return data;
  }

  async createProductType(dto: CreateProductTypeDto) {
    const name = (dto.name || '').trim();
    if (!name) throw new BadRequestException('Tên loại không được để trống');
    if (!dto.brand_id) throw new BadRequestException('Vui lòng chọn thương hiệu trước');

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('product_types')
      .insert({
        brand_id: dto.brand_id,
        name,
        slug: BrandsService.toSlug(name),
        sort_order: dto.sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi tạo loại sản phẩm:', error);
      if (error.code === '23505') {
        throw new BadRequestException(`Loại "${name}" đã tồn tại trong thương hiệu này`);
      }
      throw new BadRequestException(`Không thể tạo loại: ${error.message}`);
    }
    return { ...data, product_count: 0 };
  }

  async updateProductType(id: string, dto: UpdateProductTypeDto) {
    const payload: any = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('Tên loại không được để trống');
      payload.name = name;
      payload.slug = BrandsService.toSlug(name);
    }
    if (dto.sort_order !== undefined) payload.sort_order = dto.sort_order;

    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('product_types')
      .update(payload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error('Lỗi cập nhật loại sản phẩm:', error);
      if (error.code === '23505') throw new BadRequestException('Tên loại này đã tồn tại trong thương hiệu');
      throw new BadRequestException(`Không thể cập nhật loại: ${error.message}`);
    }
    if (!data) throw new NotFoundException('Không tìm thấy loại sản phẩm');
    return data;
  }

  /** Xóa loại: sản phẩm KHÔNG bị xóa, chỉ bị gỡ loại (ON DELETE SET NULL). */
  async deleteProductType(id: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.from('product_types').delete().eq('id', id);
    if (error) {
      this.logger.error('Lỗi xóa loại sản phẩm:', error);
      throw new BadRequestException(`Không thể xóa loại: ${error.message}`);
    }
    return { success: true };
  }
}
