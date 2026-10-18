import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdatePolicyDto } from './content.dto';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getActivePolicies() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('policies')
      .select('id, type, slug, title, summary, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Lỗi lấy danh sách chính sách:', error);
      return [];
    }

    return data || [];
  }

  async getAllPoliciesAdmin() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Lỗi lấy danh sách chính sách Admin:', error);
      return [];
    }

    return data || [];
  }

  async getPolicyVersions(policyId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('policy_versions')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi lấy phiên bản chính sách:', error);
      return [];
    }

    return data || [];
  }

  async togglePolicyStatus(id: string, isActive: boolean) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('policies')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Không thể đổi trạng thái chính sách: ${error.message}`);
    }

    return data;
  }

  async publishNewVersion(policyId: string, versionName: string, content: string) {
    const supabase = this.supabaseService.getClient();

    const { data: newVer, error: verError } = await supabase
      .from('policy_versions')
      .insert([
        {
          policy_id: policyId,
          version: versionName.trim(),
          content: content,
          effective_from: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (verError) {
      throw new BadRequestException(`Lỗi tạo phiên bản: ${verError.message}`);
    }

    const { data: updatedPolicy, error: policyError } = await supabase
      .from('policies')
      .update({
        current_version_id: newVer.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', policyId)
      .select()
      .single();

    if (policyError) {
      throw new BadRequestException(`Lỗi cập nhật phiên bản chính sách: ${policyError.message}`);
    }

    return { policy: updatedPolicy, version: newVer };
  }

  async activateVersion(policyId: string, versionId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('policies')
      .update({
        current_version_id: versionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', policyId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Lỗi kích hoạt phiên bản: ${error.message}`);
    }

    return data;
  }

  async getPolicyBySlug(slug: string) {
    const supabase = this.supabaseService.getClient();

    const { data: policy, error: policyError } = await supabase
      .from('policies')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (policyError || !policy) {
      throw new NotFoundException('Không tìm thấy chính sách tương ứng.');
    }

    let versionData: any = null;
    if (policy.current_version_id) {
      const { data: v } = await supabase
        .from('policy_versions')
        .select('*')
        .eq('id', policy.current_version_id)
        .maybeSingle();
      versionData = v;
    }

    if (!versionData) {
      const { data: latestV } = await supabase
        .from('policy_versions')
        .select('*')
        .eq('policy_id', policy.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      versionData = latestV;
    }

    return {
      ...policy,
      content: versionData?.content || policy.summary || 'Nội dung đang được cập nhật...',
      version: versionData ? {
        id: versionData.id,
        version_number: versionData.version || 'v1.0',
        effective_date: versionData.effective_from || versionData.created_at,
        change_summary: versionData.change_summary,
      } : null,
    };
  }

  async updatePolicy(id: string, dto: UpdatePolicyDto) {
    const supabase = this.supabaseService.getClient();

    const { data: existing, error: existErr } = await supabase
      .from('policies')
      .select('id, type, slug')
      .eq('id', id)
      .maybeSingle();

    if (existErr || !existing) {
      throw new NotFoundException('Không tìm thấy chính sách để cập nhật.');
    }

    const { data: updatedPolicy, error: updateErr } = await supabase
      .from('policies')
      .update({
        title: dto.title,
        summary: dto.summary || null,
        is_active: dto.isActive !== undefined ? dto.isActive : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      throw new BadRequestException(`Không thể cập nhật chính sách: ${updateErr.message}`);
    }

    return updatedPolicy;
  }

  async getBusinessInfo() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('business_information')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      this.logger.error('Lỗi lấy thông tin doanh nghiệp:', error);
      return null;
    }
    if (data && typeof data.ecommerce_enabled === 'undefined') {
      data.ecommerce_enabled = true;
    }
    return data;
  }

  async saveBusinessInfo(dto: any) {
    const supabase = this.supabaseService.getClient();
    const payload: any = {
      business_name: dto.business_name,
      tax_code: dto.tax_code,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      representative: dto.representative,
      license_issued_date: dto.license_issued_date,
      license_issued_by: dto.license_issued_by,
      map_url: dto.map_url,
      slogan: dto.slogan || null,
      facebook_url: dto.facebook_url || null,
      tiktok_url: dto.tiktok_url || null,
      youtube_url: dto.youtube_url || null,
      map_embed_url: dto.map_embed_url || null,
      updated_at: new Date().toISOString(),
    };

    if (typeof dto.ecommerce_enabled === 'boolean') {
      payload.ecommerce_enabled = dto.ecommerce_enabled;
    }

    const executeSave = async (dataPayload: any) => {
      if (dto.id) {
        return supabase
          .from('business_information')
          .update(dataPayload)
          .eq('id', dto.id)
          .select()
          .single();
      } else {
        return supabase
          .from('business_information')
          .insert([dataPayload])
          .select()
          .single();
      }
    };

    let { data, error } = await executeSave(payload);

    // Fallback nếu cột ecommerce_enabled chưa được tạo trên Supabase DB
    if (error && (error.code === '42703' || /ecommerce_enabled/.test(error.message))) {
      this.logger.warn(
        'Cột ecommerce_enabled chưa có trong business_information. Vui lòng chạy file migration 20261018_add_ecommerce_toggle_and_product_sale_mode.sql trên Supabase. Đang lưu các trường khác...',
      );
      delete payload.ecommerce_enabled;
      const retryResult = await executeSave(payload);
      data = retryResult.data;
      error = retryResult.error;
      if (data) {
        data.ecommerce_enabled = dto.ecommerce_enabled ?? true;
      }
    }

    if (error) {
      throw new BadRequestException(`Không thể lưu thông tin doanh nghiệp: ${error.message}`);
    }
    return data;
  }
}
