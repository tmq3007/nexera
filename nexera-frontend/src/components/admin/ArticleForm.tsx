"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ArticleFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ArticleForm({ initialData, onSuccess, onCancel }: ArticleFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    content: initialData?.content || "",
    image_url: initialData?.image_url || "",
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) || !prev.slug ? generateSlug(title) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      title: form.title,
      slug: form.slug,
      content: form.content || null,
      image_url: form.image_url || null,
    };

    let error;

    if (initialData?.id) {
      const result = await supabase.from("articles").update(dataToSave).eq("id", initialData.id);
      error = result.error;
    } else {
      const result = await supabase.from("articles").insert(dataToSave);
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug (URL)</label>
        <input
          type="text"
          value={form.slug}
          onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nội dung bài viết</label>
        <textarea
          rows={8}
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh đại diện bài viết</label>
        <ImageUpload
          value={form.image_url}
          onChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          folder="articles"
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
