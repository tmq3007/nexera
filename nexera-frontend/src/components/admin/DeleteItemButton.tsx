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

    const supabase = createClient();
    const { error } = await supabase.from(table).delete().eq("id", itemId);

    if (error) {
      alert("Lỗi khi xoá: " + error.message);
    } else {
      router.refresh();
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
