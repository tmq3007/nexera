import { createClient } from "@/utils/supabase/server";
import { OrderManager } from "@/components/admin/OrderManager";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(*)")
    .order("created_at", { ascending: false });

  return <OrderManager orders={orders || []} />;
}

