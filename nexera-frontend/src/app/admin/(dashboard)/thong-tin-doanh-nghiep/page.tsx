"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@/lib/api/content.api";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Save, RefreshCw, MapPin, Phone, Mail, FileText, Globe, Megaphone } from "lucide-react";

interface BusinessInfoForm {
  id?: string;
  business_name: string;
  tax_code: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  representative: string;
  license_issued_date: string;
  license_issued_by: string;
  map_url: string;
  slogan: string;
  facebook_url: string;
  tiktok_url: string;
  youtube_url: string;
  map_embed_url: string;
}

export default function BusinessInfoAdminPage() {
  const [formData, setFormData] = useState<BusinessInfoForm>({
    business_name: "",
    tax_code: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    representative: "",
    license_issued_date: "",
    license_issued_by: "",
    map_url: "",
    slogan: "",
    facebook_url: "",
    tiktok_url: "",
    youtube_url: "",
    map_embed_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useToast();
  const { accessToken } = useAuth();

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    setLoading(true);
    try {
      const data = await contentApi.getBusinessInfo();

      if (data) {
        setFormData({
          id: data.id,
          business_name: data.business_name || "",
          tax_code: data.tax_code || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          representative: data.representative || "",
          license_issued_date: data.license_issued_date || "",
          license_issued_by: data.license_issued_by || "",
          map_url: data.map_url || "",
          slogan: data.slogan || "",
          facebook_url: data.facebook_url || "",
          tiktok_url: data.tiktok_url || "",
          youtube_url: data.youtube_url || "",
          map_embed_url: data.map_embed_url || "",
        });
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin doanh nghiệp:", err);
      toast.error("Không thể tải thông tin doanh nghiệp.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await contentApi.saveBusinessInfo(formData, accessToken!);
      if (res && res.id) {
        setFormData((prev) => ({ ...prev, id: res.id }));
      }
      toast.success("Cập nhật thông tin doanh nghiệp thành công! Footer website đã đồng bộ.");
    } catch (err: any) {
      console.error("Lỗi cập nhật:", err);
      toast.error(`Cập nhật thất bại: ${err.message || "Đã xảy ra lỗi"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-gray-600 font-medium">Đang tải thông tin doanh nghiệp...</span>
      </div>
    );
  }

  return (
    <>



      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tên doanh nghiệp */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Tên Doanh Nghiệp / Công Ty <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 font-medium text-sm"
              placeholder="CÔNG TY CỔ PHẦN TẬP ĐOÀN NEXERA"
            />
          </div>

          {/* Mã số thuế */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              Mã Số Thuế (MST) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.tax_code}
              onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="0109999999"
            />
          </div>

          {/* Người đại diện */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Người Đại Diện Theo Pháp Luật
            </label>
            <input
              type="text"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="Nguyễn Văn A"
            />
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              Số Điện Thoại Hotline <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="0123.456.789"
            />
          </div>

          {/* Email liên hệ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Email Liên Hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="contact@nexera.com"
            />
          </div>

          {/* Địa chỉ trụ sở */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Địa Chỉ Trụ Sở Chính <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="Tầng 12, Tòa nhà Nexera Tower, Hà Nội, Việt Nam"
            />
          </div>

          {/* Nơi cấp GPKD */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cơ Quan Cấp GPKD
            </label>
            <input
              type="text"
              value={formData.license_issued_by}
              onChange={(e) => setFormData({ ...formData, license_issued_by: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="Sở Kế hoạch và Đầu tư TP. Hà Nội"
            />
          </div>

          {/* Ngày cấp GPKD */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ngày Cấp GPKD
            </label>
            <input
              type="text"
              value={formData.license_issued_date}
              onChange={(e) => setFormData({ ...formData, license_issued_date: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="Ngày cấp: 01/01/2026"
            />
          </div>

          {/* Link Website */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Website Chính Thức
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="https://nexerasolar.com"
            />
          </div>

          {/* Google Map URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Google Maps URL
            </label>
            <input
              type="url"
              value={formData.map_url}
              onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
              placeholder="https://maps.google.com/?q=..."
            />
          </div>

          {/* Google Maps Embed URL */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              Google Maps Embed (Nhúng bản đồ Footer)
            </label>
            <textarea
              rows={3}
              value={formData.map_embed_url}
              onChange={(e) => {
                let value = e.target.value.trim();
                // Tự động trích xuất src từ iframe tag nếu dán cả đoạn HTML
                const match = value.match(/src=["']([^"']+)["']/);
                if (match) {
                  value = match[1];
                }
                setFormData({ ...formData, map_embed_url: value });
              }}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm font-mono resize-none"
              placeholder='Dán iframe từ Google Maps vào đây, ví dụ: <iframe src="https://www.google.com/maps/embed?pb=..."></iframe>'
            />
            <p className="text-xs text-gray-400 mt-1">
              Dán cả đoạn {'<iframe>'} từ Google Maps (Share → Embed a map → copy HTML). Hệ thống sẽ tự trích xuất URL.
            </p>
          </div>
        </div>

        {/* Section: Thương hiệu */}
        <div className="border-t border-gray-100 pt-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slogan */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-gray-500" />
                Slogan Doanh Nghiệp
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
                placeholder="Năng lượng xanh - vì tương lai bền vững"
              />
              <p className="text-xs text-gray-400 mt-1">Hiển thị ở Footer website, dưới mục &quot;VỀ CHÚNG TÔI&quot;</p>
            </div>
          </div>
        </div>

        {/* Section: Mạng xã hội */}
        <div className="border-t border-gray-100 pt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" />
            Mạng Xã Hội
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Facebook */}
            <div>

              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                Facebook
              </label>
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
                placeholder="https://www.facebook.com/nexerasolar"
              />
            </div>

            {/* YouTube */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white" /></svg>
                YouTube
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
                placeholder="https://www.youtube.com/@nexerasolar"
              />
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                TikTok
              </label>
              <input
                type="url"
                value={formData.tiktok_url}
                onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800 text-sm"
                placeholder="https://www.tiktok.com/@nexerasolar"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Các liên kết này hiển thị trên Footer website. Để trống nếu không muốn hiển thị.</p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
