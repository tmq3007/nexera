"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function ImageUpload({ value, onChange, folder = "products" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Chỉ chấp nhận file hình ảnh.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước file không được vượt quá 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${BACKEND_URL}/upload?folder=${encodeURIComponent(folder)}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload thất bại (HTTP ${response.status})`);
      }

      const data = await response.json();
      onChange(data.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Đã xảy ra lỗi khi tải ảnh lên.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
          <img 
            src={value} 
            alt="Uploaded preview" 
            className="max-h-[200px] w-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="Xóa ảnh"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${error ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-2" />
              <p className="text-sm font-medium">Đang tải lên...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Click để chọn ảnh tải lên</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Tối đa 5MB)</p>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
}
