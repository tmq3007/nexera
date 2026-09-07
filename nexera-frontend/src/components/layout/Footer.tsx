"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { MapPin, Phone, Mail } from "lucide-react";
import { getBusinessInformation, getActivePolicies, BusinessInfo, PolicyItem } from "@/utils/policies";

export function Footer() {
  const [company, setCompany] = useState<BusinessInfo>({
    business_name: siteConfig.company.name,
    tax_code: siteConfig.company.taxCode,
    address: siteConfig.company.address,
    phone: siteConfig.company.phone,
    email: siteConfig.company.email,
  });

  const [policies, setPolicies] = useState<PolicyItem[]>(
    siteConfig.policies.map((p) => ({
      id: p.href,
      type: "CUSTOM",
      slug: p.href.replace("/chinh-sach/", ""),
      title: p.title,
      href: p.href,
    }))
  );

  useEffect(() => {
    async function loadFooterData() {
      const [info, policyList] = await Promise.all([
        getBusinessInformation(),
        getActivePolicies(),
      ]);
      if (info) setCompany(info);
      if (policyList && policyList.length > 0) setPolicies(policyList);
    }
    loadFooterData();
  }, []);

  return (
    <footer className="bg-[#13426E] text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: About */}
          <div>
            <h3 className="text-xl font-bold mb-4">VỀ CHÚNG TÔI</h3>
            <div className="w-12 h-1 bg-[#80BF49] mb-6"></div>
            <p className="text-sm text-gray-200 mb-6 leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex gap-4">
              <Link href={siteConfig.social.facebook} className="bg-white/10 p-2 rounded-full hover:bg-[#80BF49] transition-colors">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                   <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href={siteConfig.social.tiktok} className="bg-white/10 p-2 rounded-full hover:bg-[#80BF49] transition-colors">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                   <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </Link>
              <Link href={siteConfig.social.youtube} className="bg-white/10 p-2 rounded-full hover:bg-[#80BF49] transition-colors">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                   <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                   <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"></polygon>
                </svg>
              </Link>
            </div>
          </div>

          {/* Column 2: Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">LIÊN KẾT NHANH</h3>
            <div className="w-12 h-1 bg-[#80BF49] mb-6"></div>
            <ul className="space-y-3">
              <li>
                <Link href="/gioi-thieu/ve-nexera" className="text-gray-200 hover:text-[#80BF49] transition-colors flex items-center gap-2">
                  <span className="text-[#80BF49]">❯</span> Về Nexera
                </Link>
              </li>
              <li>
                <Link href="/du-an/cong-nghiep" className="text-gray-200 hover:text-[#80BF49] transition-colors flex items-center gap-2">
                  <span className="text-[#80BF49]">❯</span> Dự án tiêu biểu
                </Link>
              </li>
              <li>
                <Link href="/san-pham/tron-goi" className="text-gray-200 hover:text-[#80BF49] transition-colors flex items-center gap-2">
                  <span className="text-[#80BF49]">❯</span> Giải pháp & Dịch vụ
                </Link>
              </li>
              <li>
                <Link href="/tin-tuc/nexera" className="text-gray-200 hover:text-[#80BF49] transition-colors flex items-center gap-2">
                  <span className="text-[#80BF49]">❯</span> Tin tức
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">THÔNG TIN CÔNG TY</h3>
            <div className="w-12 h-1 bg-[#80BF49] mb-6"></div>
            <p className="font-bold text-gray-100 mb-2 uppercase">{company.business_name}</p>
            <p className="text-sm text-gray-200 mb-4">Mã số thuế: {company.tax_code}</p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#80BF49] shrink-0 mt-1" />
                <span className="text-sm text-gray-200">{company.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#80BF49] shrink-0" />
                <span className="text-sm text-gray-200">{company.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#80BF49] shrink-0" />
                <span className="text-sm text-gray-200">{company.email}</span>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Policies */}
          <div>
            <h3 className="text-xl font-bold mb-4">CHÍNH SÁCH</h3>
            <div className="w-12 h-1 bg-[#80BF49] mb-6"></div>
            <ul className="space-y-3">
              {policies.map((policy) => (
                <li key={policy.id || policy.href}>
                  <Link href={policy.href} className="text-sm text-gray-200 hover:text-[#80BF49] transition-colors flex items-center gap-2">
                    <span className="text-[#80BF49]">❯</span> {policy.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} {siteConfig.name}. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
