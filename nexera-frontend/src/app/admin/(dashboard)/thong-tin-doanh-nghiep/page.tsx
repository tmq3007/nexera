"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@/lib/api/content.api";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Save, RefreshCw, MapPin, Phone, Mail, FileText, Globe, Megaphone, ShoppingCart, ShieldAlert, Loader2, Info } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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
  ecommerce_enabled: boolean;
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
    ecommerce_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [isUpdatingEcommerce, setIsUpdatingEcommerce] = useState(false);

  const toast = useToast();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

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
          ecommerce_enabled: data.ecommerce_enabled ?? true,
        });
      }
    } catch (err: any) {
      console.error("Lỗi khi tải thông tin doanh nghiệp:", err);
      toast.error("Không thể tải thông tin doanh nghiệp.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lưu trực tiếp chế độ bán hàng vào Database ngay khi gạt công tắc / confirm
   * Không cần người dùng phải bấm "Lưu thay đổi" ở cuối trang.
   */
  const handleToggleEcommerce = async (nextState: boolean) => {
    setIsUpdatingEcommerce(true);
    try {
      const payload: BusinessInfoForm = {
        ...formData,
        ecommerce_enabled: nextState,
      };

      const res = await contentApi.saveBusinessInfo(payload, accessToken!);
      if (res && res.id) {
        setFormData((prev) => ({ ...prev, id: res.id, ecommerce_enabled: nextState }));
      } else {
        setFormData((prev) => ({ ...prev, ecommerce_enabled: nextState }));
      }

      // Làm mới cache dữ liệu bán hàng toàn hệ thống
      queryClient.invalidateQueries({ queryKey: ["business-info-ecommerce"] });
      window.dispatchEvent(new CustomEvent("ecommerce-config-changed", { detail: { enabled: nextState } }));

      if (nextState) {
        toast.success("Đã BẬT bán hàng trực tuyến! Giỏ hàng & thanh toán online đã hoạt động trở lại.");
      } else {
        toast.success("Đã chuyển sang chế độ CHỈ TƯ VẤN. Giỏ hàng & thanh toán online đã được ẩn!");
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật chế độ bán hàng:", err);
      toast.error(`Không thể cập nhật chế độ bán hàng: ${err.message || "Đã xảy ra lỗi"}`);
    } finally {
      setIsUpdatingEcommerce(false);
      setShowDisableConfirm(false);
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
      toast.success("Cập nhật thông tin doanh nghiệp thành công! Footer & chế độ bán hàng website đã đồng bộ.");
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
        
        {/* ============================================================== */}
        {/* NÚT BẬT / TẮT CHẾ ĐỘ BÁN HÀNG ONLINE (ECOMMERCE & TƯ VẤN)     */}
        {/* ============================================================== */}
        <div className={`rounded-xl border p-5 transition-all ${
          formData.ecommerce_enabled
            ? "bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border-emerald-200"
            : "bg-gradient-to-r from-amber-50/80 to-orange-50/60 border-amber-200"
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                formData.ecommerce_enabled ? "bg-emerald-600 text-white shadow-sm" : "bg-amber-600 text-white shadow-sm"
              }`}>
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-gray-900">
                    Chế Độ Bán Hàng Trực Tuyến (Ecommerce)
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                    formData.ecommerce_enabled 
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${formData.ecommerce_enabled ? "bg-emerald-600 animate-pulse" : "bg-amber-600"}`} />
                    {formData.ecommerce_enabled ? "Đang BẬT bán hàng" : "Đang TẮT (Chỉ nhận tư vấn)"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 max-w-2xl leading-relaxed">
                  {formData.ecommerce_enabled ? (
                    <>Khách hàng có thể <strong>Thêm vào giỏ</strong>, bấm <strong>Mua ngay</strong> và thanh toán đơn hàng online trực tiếp qua PayOS. (Bạn vẫn có thể ép từng sản phẩm sang chế độ &quot;Chỉ tư vấn&quot; trong phần quản lý sản phẩm).</>
                  ) : (
                    <>Toàn bộ website chuyển sang <strong>chế độ giới thiệu &amp; tư vấn</strong>: Ẩn nút &quot;Mua ngay&quot;, ẩn &quot;Thêm giỏ&quot;, ẩn icon Giỏ hàng trên thanh Header. Các nút đổi thành <strong>&quot;Nhận Tư Vấn Ngay&quot;</strong> dẫn vào Live Chat hoặc Form liên hệ.</>
                  )}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <span className="text-xs font-bold text-gray-500 hidden sm:inline">
                {isUpdatingEcommerce ? "Đang lưu..." : formData.ecommerce_enabled ? "Bật" : "Tắt"}
              </span>
              <button
                type="button"
                role="switch"
                disabled={isUpdatingEcommerce}
                aria-checked={formData.ecommerce_enabled}
                onClick={() => {
                  if (isUpdatingEcommerce) return;
                  if (formData.ecommerce_enabled) {
                    setShowDisableConfirm(true);
                  } else {
                    handleToggleEcommerce(true);
                  }
                }}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                  formData.ecommerce_enabled ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    formData.ecommerce_enabled ? "translate-x-7" : "translate-x-0"
                  }`}
                >
                  {isUpdatingEcommerce && (
                    <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {!formData.ecommerce_enabled && (
            <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center gap-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Website đang ở <strong>chế độ Chỉ Tư Vấn</strong> (đã lưu &amp; áp dụng tự động). Khách hàng sẽ kết nối qua Zalo, Hotline hoặc gửi yêu cầu tư vấn thay vì thanh toán online.</span>
            </div>
          )}
        </div>

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

      {/* Modal xác nhận chuyển sang chế độ Chỉ Tư Vấn */}
      <ConfirmModal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={() => handleToggleEcommerce(false)}
        loading={isUpdatingEcommerce}
        title="Xác nhận tắt chế độ bán hàng trực tuyến"
        message={
          <div className="space-y-2 text-sm leading-relaxed">
            <p>
              Website sẽ được <strong>lưu &amp; chuyển ngay sang chế độ giới thiệu - tư vấn</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-500">
              <li>Ẩn toàn bộ nút <strong>&quot;Mua ngay&quot;</strong> và <strong>&quot;Thêm vào giỏ&quot;</strong>.</li>
              <li>Ẩn biểu tượng Giỏ hàng trên thanh điều hướng Header.</li>
              <li>Các nút trên sản phẩm chuyển sang <strong>&quot;Nhận Tư Vấn Ngay&quot;</strong> (mở Modal chọn Zalo, Hotline, Live Chat hoặc để lại SĐT).</li>
            </ul>
            <p className="text-amber-700 font-medium pt-1">
              Bạn có chắc chắn muốn tắt chế độ bán hàng online ngay bây giờ không?
            </p>
          </div>
        }
        confirmText="Xác nhận tắt bán hàng"
        cancelText="Giữ nguyên"
      />
    </>
  );
}
