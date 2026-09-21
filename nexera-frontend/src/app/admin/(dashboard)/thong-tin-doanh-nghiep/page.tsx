"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@/lib/api/content.api";
import { useToast } from "@/contexts/ToastContext";
import { Building2, Save, RefreshCw, MapPin, Phone, Mail, FileText, Globe } from "lucide-react";

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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useToast();

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
      const res = await contentApi.saveBusinessInfo(formData);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thông tin doanh nghiệp</h1>
          <p className="text-gray-500 text-sm mt-1">
            Chỉnh sửa thông tin công ty hiển thị tại Footer và các trang chính sách
          </p>
        </div>
        <button
          onClick={fetchBusinessInfo}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

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
