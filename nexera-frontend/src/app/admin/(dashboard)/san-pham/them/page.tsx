import { createClient } from "@/utils/supabase/server";
import { ProductFormPage } from "@/components/admin/ProductFormPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thêm sản phẩm mới | Nexera Admin",
};

export default async function ProductCreatePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <ProductFormPage
      mode="create"
      categories={categories || []}
    />
  );
}
