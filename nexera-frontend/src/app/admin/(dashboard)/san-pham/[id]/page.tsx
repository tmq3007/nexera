import { createClient } from "@/utils/supabase/server";
import { ProductFormPage } from "@/components/admin/ProductFormPage";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .single();

  return {
    title: product ? `Sửa: ${product.name} | Nexera Admin` : "Chỉnh sửa sản phẩm | Nexera Admin",
  };
}

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("id, name").order("name"),
  ]);

  if (!product) notFound();

  return (
    <ProductFormPage
      mode="edit"
      initialData={product}
      categories={categories || []}
    />
  );
}
