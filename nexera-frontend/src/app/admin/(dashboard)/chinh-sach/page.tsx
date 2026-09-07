"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/contexts/ToastContext";
import {
  Plus,
  History,
  RefreshCw,
  Edit3,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";

interface Policy {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary: string | null;
  is_active: boolean;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface PolicyVersion {
  id: string;
  policy_id: string;
  version: string;
  content: string;
  effective_from: string;
  created_at: string;
}

export default function PoliciesAdminPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // New Version Form State
  const [showEditor, setShowEditor] = useState(false);
  const [versionName, setVersionName] = useState("v1.1");
  const [versionContent, setVersionContent] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPolicies(data || []);

      if (data && data.length > 0 && !selectedPolicy) {
        handleSelectPolicy(data[0]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải chính sách:", err);
      toast.error("Không thể tải danh sách chính sách từ hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPolicy = async (policy: Policy) => {
    setSelectedPolicy(policy);
    setShowEditor(false);
    setLoadingVersions(true);

    try {
      const { data, error } = await supabase
        .from("policy_versions")
        .select("*")
        .eq("policy_id", policy.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVersions(data || []);

      const activeVer = data?.find((v) => v.id === policy.current_version_id) || data?.[0];
      if (activeVer) {
        setVersionContent(activeVer.content);
        const currentVerNum = parseFloat(activeVer.version.replace("v", "")) || 1.0;
        setVersionName(`v${(currentVerNum + 0.1).toFixed(1)}`);
      } else {
        setVersionContent("");
        setVersionName("v1.0");
      }
    } catch (err: any) {
      console.error("Lỗi tải lịch sử phiên bản:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const togglePolicyStatus = async (policy: Policy) => {
    const newStatus = !policy.is_active;
    try {
      const { error } = await supabase
        .from("policies")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("id", policy.id);

      if (error) throw error;

      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, is_active: newStatus } : p))
      );
      if (selectedPolicy?.id === policy.id) {
        setSelectedPolicy((prev) => (prev ? { ...prev, is_active: newStatus } : null));
      }
      
      // Toast notification at bottom-right
      if (newStatus) {
        toast.success(`Đã chuyển chính sách "${policy.title}" sang trạng thái HIỂN THỊ`);
      } else {
        toast.info(`Đã chuyển chính sách "${policy.title}" sang trạng thái TẠM ẨN`);
      }
    } catch (err: any) {
      toast.error(`Lỗi cập nhật trạng thái: ${err.message}`);
    }
  };

  const handlePublishNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    setSaving(true);

    try {
      const { data: newVer, error: verError } = await supabase
        .from("policy_versions")
        .insert([
          {
            policy_id: selectedPolicy.id,
            version: versionName.trim(),
            content: versionContent,
            effective_from: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (verError) throw verError;

      const { error: policyUpdateError } = await supabase
        .from("policies")
        .update({
          current_version_id: newVer.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPolicy.id);

      if (policyUpdateError) throw policyUpdateError;

      toast.success(`Xuất bản phiên bản ${versionName} cho "${selectedPolicy.title}" thành công!`);

      await fetchPolicies();
      await handleSelectPolicy({
        ...selectedPolicy,
        current_version_id: newVer.id,
      });
      setShowEditor(false);
    } catch (err: any) {
      console.error("Lỗi xuất bản phiên bản:", err);
      toast.error(`Xuất bản thất bại: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleActivateVersion = async (version: PolicyVersion) => {
    if (!selectedPolicy) return;
    try {
      const { error } = await supabase
        .from("policies")
        .update({
          current_version_id: version.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPolicy.id);

      if (error) throw error;

      toast.success(`Đã chuyển phiên bản hoạt động sang ${version.version}!`);

      const updatedPolicy = { ...selectedPolicy, current_version_id: version.id };
      setSelectedPolicy(updatedPolicy);
      setPolicies((prev) =>
        prev.map((p) => (p.id === selectedPolicy.id ? updatedPolicy : p))
      );
    } catch (err: any) {
      toast.error(`Lỗi kích hoạt phiên bản: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách chính sách...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý chính sách</h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý các loại chính sách và xuất bản phiên bản sửa đổi (Policy Versioning)
          </p>
        </div>
        <button
          onClick={fetchPolicies}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Tải lại dữ liệu"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of 5 Policies */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Danh sách chính sách ({policies.length})
          </h2>
          {policies.map((policy) => {
            const isSelected = selectedPolicy?.id === policy.id;
            return (
              <div
                key={policy.id}
                onClick={() => handleSelectPolicy(policy)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#13426E] text-white border-[#13426E] shadow-sm"
                    : "bg-white text-gray-800 border-gray-100 hover:border-gray-300"
                }`}
              >
                <div className="flex-1 pr-3">
                  <h3 className={`font-semibold text-sm ${isSelected ? "text-white" : "text-gray-800"}`}>
                    {policy.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePolicyStatus(policy);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors shrink-0 ${
                    policy.is_active
                      ? isSelected
                        ? "bg-[#80BF49] text-white border-[#80BF49]"
                        : "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
                      : isSelected
                      ? "bg-white/20 text-gray-300 border-white/20"
                      : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {policy.is_active ? "Hiển thị" : "Tạm ẩn"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Policy Content & Version Manager */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPolicy ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              {/* Header of selected policy */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">{selectedPolicy.title}</h2>

                {!showEditor && (
                  <button
                    onClick={() => setShowEditor(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Xuất bản phiên bản mới
                  </button>
                )}
              </div>

              {/* Version Publishing Editor Form */}
              {showEditor ? (
                <form onSubmit={handlePublishNewVersion} className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[var(--primary)]" />
                      Soạn thảo phiên bản mới
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEditor(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Tên phiên bản (VD: v1.1, v2.0):
                    </label>
                    <input
                      type="text"
                      required
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      className="w-48 px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nội dung chính sách:
                    </label>
                    <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
                      <p className="font-semibold">Hướng dẫn định dạng Markdown:</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-blue-700">
                        <span><code className="bg-blue-100 px-1 rounded">## Tiêu đề</code> → Tiêu đề mục</span>
                        <span><code className="bg-blue-100 px-1 rounded">### Tiêu đề phụ</code> → Tiêu đề nhỏ</span>
                        <span><code className="bg-blue-100 px-1 rounded">- Nội dung</code> → Danh sách gạch đầu dòng</span>
                        <span>Dòng trống giữa 2 đoạn → Tách đoạn văn</span>
                      </div>
                    </div>
                    <textarea
                      required
                      rows={14}
                      value={versionContent}
                      onChange={(e) => setVersionContent(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-white"
                      placeholder={`## 1. Điều kiện đổi trả\n\nSản phẩm được đổi trả trong vòng 7 ngày...\n\n## 2. Quy trình hoàn tiền\n\n- Bước 1: Liên hệ hotline\n- Bước 2: Gửi sản phẩm về kho`}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditor(false)}
                      className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-xs bg-[var(--primary)] hover:bg-[var(--primary-light)] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Đang xuất bản...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Xuất bản & kích hoạt phiên bản này
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}

              {/* Version History Table */}
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  Lịch sử các phiên bản ({versions.length})
                </h3>

                {loadingVersions ? (
                  <div className="py-8 text-center text-gray-500 text-sm">Đang tải lịch sử phiên bản...</div>
                ) : versions.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm bg-gray-50 rounded-xl">
                    Chưa có phiên bản nào được lưu trong cơ sở dữ liệu.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((ver) => {
                      const isActiveVersion = selectedPolicy.current_version_id === ver.id;
                      return (
                        <div
                          key={ver.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isActiveVersion
                              ? "bg-green-50/60 border-green-200"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-xs font-mono text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                                {ver.version}
                              </span>
                              <span className="text-xs text-gray-500">
                                Tạo ngày: {new Date(ver.created_at).toLocaleString("vi-VN")}
                              </span>
                              {isActiveVersion && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Đang hoạt động trên website
                                </span>
                              )}
                            </div>

                            {!isActiveVersion && (
                              <button
                                onClick={() => handleActivateVersion(ver)}
                                className="text-xs text-[var(--primary)] hover:underline font-medium"
                              >
                                Đặt làm phiên bản hoạt động
                              </button>
                            )}
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {ver.content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
              Vui lòng chọn một chính sách bên danh sách để xem chi tiết và quản lý phiên bản.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
