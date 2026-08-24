"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ProjectFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSuccess, onCancel }: ProjectFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "INDUSTRIAL",
    description: initialData?.description || "",
    image_url: initialData?.image_url || "",
    completion_date: initialData?.completion_date || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      name: form.name,
      category: form.category,
      description: form.description || null,
      image_url: form.image_url || null,
      completion_date: form.completion_date || null,
    };

    let error;

    if (initialData?.id) {
      const result = await supabase.from("projects").update(dataToSave).eq("id", initialData.id);
      error = result.error;
    } else {
      const result = await supabase.from("projects").insert(dataToSave);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên dự án <span className="text-red-500">*</span></label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục <span className="text-red-500">*</span></label>
          <select
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          >
            <option value="INDUSTRIAL">Công nghiệp</option>
            <option value="RESIDENTIAL">Dân dụng</option>
            <option value="SOLAR">Điện mặt trời</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày hoàn thành</label>
          <input
            type="date"
            value={form.completion_date}
            onChange={(e) => setForm((prev) => ({ ...prev, completion_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả dự án</label>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh dự án</label>
        <ImageUpload
          value={form.image_url}
          onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          folder="projects"
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-light)] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Đang lưu..." : "Lưu lại"}
        </button>
      </div>
    </form>
  );
}
