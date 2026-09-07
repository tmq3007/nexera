import { createClient } from "./supabase/client";
import { siteConfig } from "@/config/site";

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

export interface PolicyDetail extends PolicyItem {
  version: string;
  content: string;
  effective_from: string;
  updated_at: string;
}

export async function getBusinessInformation(): Promise<BusinessInfo> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("business_information")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        business_name: siteConfig.company.name,
        tax_code: siteConfig.company.taxCode,
        address: siteConfig.company.address,
        phone: siteConfig.company.phone,
        email: siteConfig.company.email,
        map_url: siteConfig.company.mapUrl,
      };
    }

    return {
      business_name: data.business_name || siteConfig.company.name,
      tax_code: data.tax_code || siteConfig.company.taxCode,
      address: data.address || siteConfig.company.address,
      phone: data.phone || siteConfig.company.phone,
      email: data.email || siteConfig.company.email,
      website: data.website,
      representative: data.representative,
      license_issued_date: data.license_issued_date,
      license_issued_by: data.license_issued_by,
      map_url: data.map_url || siteConfig.company.mapUrl,
    };
  } catch {
    return {
      business_name: siteConfig.company.name,
      tax_code: siteConfig.company.taxCode,
      address: siteConfig.company.address,
      phone: siteConfig.company.phone,
      email: siteConfig.company.email,
      map_url: siteConfig.company.mapUrl,
    };
  }
}

export async function getActivePolicies(): Promise<PolicyItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("policies")
      .select("id, type, slug, title, summary")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error || !data || data.length === 0) {
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
      summary: p.summary,
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
    const supabase = await createClient();
    
    // 1. Query policy by slug
    const { data: policy, error: policyError } = await supabase
      .from("policies")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (policyError || !policy) {
      return null;
    }

    // 2. Query policy version (current_version_id or fallback to latest version)
    let versionData = null;
    if (policy.current_version_id) {
      const { data: v } = await supabase
        .from("policy_versions")
        .select("*")
        .eq("id", policy.current_version_id)
        .maybeSingle();
      versionData = v;
    }

    if (!versionData) {
      const { data: vList } = await supabase
        .from("policy_versions")
        .select("*")
        .eq("policy_id", policy.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (vList && vList.length > 0) {
        versionData = vList[0];
      }
    }

    return {
      id: policy.id,
      type: policy.type,
      slug: policy.slug,
      title: policy.title,
      summary: policy.summary,
      href: `/chinh-sach/${policy.slug}`,
      version: versionData?.version || "v1.0",
      content: versionData?.content || "Nội dung đang trong quá trình cập nhật.",
      effective_from: versionData?.effective_from || policy.updated_at,
      updated_at: policy.updated_at,
    };
  } catch {
    return null;
  }
}
