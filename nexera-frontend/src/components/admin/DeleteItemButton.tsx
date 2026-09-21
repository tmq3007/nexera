"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function DeleteItemButton({
  table,
  itemId,
  itemName,
}: {
  table: string;
  itemId: string;
  itemName: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Bạn có chắc muốn xoá "${itemName}"?`)) return;

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
    try {
      const res = await fetch(`${BACKEND_URL}/${table}/admin/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Không thể xoá mục này");
      }
      router.refresh();
    } catch (err: any) {
      alert("Lỗi khi xoá: " + err.message);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      title="Xoá"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
