import { siteConfig } from "@/config/site";
import { contentApi } from "@/lib/api/content.api";

export interface BusinessInfo {
  business_name: string;
  tax_code: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  representative?: string;
  license_issued_date?: string;
  license_issued_by?: string;
  map_url?: string;
  slogan?: string;
  facebook_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  map_embed_url?: string;
}

export interface PolicyItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary?: string;
  href: string;
}

export interface PolicyDetail {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary?: string;
  href: string;
  version: string;
  content: string;
  effective_from: string;
  updated_at?: string;
}

export async function getBusinessInfo(): Promise<BusinessInfo> {
  try {
    const data = await contentApi.getBusinessInfo();
    if (data) {
      return {
        business_name: data.business_name || siteConfig.company.name,
        tax_code: data.tax_code || siteConfig.company.taxCode,
        address: data.address || siteConfig.company.address,
        phone: data.phone || siteConfig.company.phone,
        email: data.email || siteConfig.company.email,
        website: data.website || undefined,
        representative: data.representative || undefined,
        license_issued_date: data.license_issued_date || undefined,
        license_issued_by: data.license_issued_by || undefined,
        map_url: data.map_url || siteConfig.company.mapUrl,
        slogan: data.slogan || siteConfig.description,
        facebook_url: data.facebook_url || siteConfig.social.facebook,
        tiktok_url: data.tiktok_url || siteConfig.social.tiktok,
        youtube_url: data.youtube_url || siteConfig.social.youtube,
        map_embed_url: data.map_embed_url || undefined,
      };
    }
  } catch (err) {
    console.error("Lỗi tải thông tin doanh nghiệp, sử dụng dữ liệu mặc định:", err);
  }

  // Fallback: trả về dữ liệu tĩnh từ siteConfig nếu API lỗi
  return {
    business_name: siteConfig.company.name,
    tax_code: siteConfig.company.taxCode,
    address: siteConfig.company.address,
    phone: siteConfig.company.phone,
    email: siteConfig.company.email,
    map_url: siteConfig.company.mapUrl,
    slogan: siteConfig.description,
    facebook_url: siteConfig.social.facebook,
    tiktok_url: siteConfig.social.tiktok,
    youtube_url: siteConfig.social.youtube,
  };
}

export const getBusinessInformation = getBusinessInfo;

export async function getActivePolicies(): Promise<PolicyItem[]> {
  try {
    const data = await contentApi.getActivePolicies();

    if (!data || data.length === 0) {
      return siteConfig.policies.map((p) => ({
        id: p.href,
        type: "CUSTOM",
        slug: p.href.replace("/chinh-sach/", ""),
        title: p.title,
        href: p.href,
      }));
    }

    return data.map((p) => ({
      id: p.id,
      type: p.type,
      slug: p.slug,
      title: p.title,
      summary: p.summary || undefined,
      href: `/chinh-sach/${p.slug}`,
    }));
  } catch {
    return siteConfig.policies.map((p) => ({
      id: p.href,
      type: "CUSTOM",
      slug: p.href.replace("/chinh-sach/", ""),
      title: p.title,
      href: p.href,
    }));
  }
}

export async function getPolicyBySlug(slug: string): Promise<PolicyDetail | null> {
  try {
    const policy = await contentApi.getPolicyBySlug(slug);
    if (!policy) return null;

    return {
      id: policy.id,
      type: policy.type,
      slug: policy.slug,
      title: policy.title,
      summary: policy.summary || undefined,
      href: `/chinh-sach/${policy.slug}`,
      version: policy.version ? `v${policy.version.version_number}.0` : "v1.0",
      content: policy.content || "Nội dung đang trong quá trình cập nhật.",
      effective_from: policy.version?.effective_date || new Date().toISOString(),
      updated_at: policy.version?.effective_date || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
