"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxFiles?: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export function MultiImageUpload({ value = [], onChange, folder = "products_gallery", maxFiles = 10 }: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      setError(`Bạn chỉ có thể tải lên tối đa ${maxFiles} ảnh.`);
      return;
    }

    const validFiles = files.filter(f => f.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      setError("Một số file không hợp lệ. Chỉ chấp nhận file hình ảnh.");
      if (validFiles.length === 0) return;
    }

    const oversizedFiles = validFiles.filter(f => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError("Kích thước mỗi file không được vượt quá 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Upload từng file song song qua Backend API
      const uploadPromises = validFiles.map(async (file) => {
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
        return data.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedUrls]);
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

  const handleRemove = (indexToRemove: number) => {
    const newValues = value.filter((_, index) => index !== indexToRemove);
    onChange(newValues);
  };

  return (
    <div className="w-full space-y-4">
      {/* Grid hiện ảnh */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group rounded-xl border border-gray-200 overflow-hidden bg-gray-50 aspect-square flex items-center justify-center">
              <img 
                src={url} 
                alt={`Uploaded ${index + 1}`} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Xóa ảnh"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vùng upload */}
      {value.length < maxFiles && (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${error ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"}
            ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
            disabled={isUploading}
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
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Tối đa 5MB, {maxFiles - value.length} ảnh còn lại)</p>
            </div>
          )}
        </div>
      )}
      
      {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
    </div>
  );
}
