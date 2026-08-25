import { createClient } from "@/utils/supabase/server";
import { CustomerManager } from "@/components/admin/CustomerManager";

export default async function AdminCustomersPage() {
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("*, orders(id)")
    .order("created_at", { ascending: false });

  return <CustomerManager customers={customers || []} />;
}

