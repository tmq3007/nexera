import { createClient } from "@/utils/supabase/server";
import { ProductManager } from "@/components/admin/ProductManager";

export default async function AdminProductsPage() {
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories }
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .order("name")
  ]);

  return <ProductManager products={products || []} categories={categories || []} />;
}

