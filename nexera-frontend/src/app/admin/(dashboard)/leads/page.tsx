import { createClient } from "@/utils/supabase/server";
import { LeadManager } from "@/components/admin/LeadManager";

export default async function AdminLeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return <LeadManager leads={leads || []} />;
}

