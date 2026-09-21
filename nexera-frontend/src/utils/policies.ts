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
  return {
    business_name: siteConfig.company.name,
    tax_code: siteConfig.company.taxCode,
    address: siteConfig.company.address,
    phone: siteConfig.company.phone,
    email: siteConfig.company.email,
    map_url: siteConfig.company.mapUrl,
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
