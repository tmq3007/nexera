export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { LeadManager } from "@/components/admin/LeadManager";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  
  const status = typeof params?.status === 'string' ? params.status : "";
  const service = typeof params?.service === 'string' ? params.service : "";
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (status) query = query.eq("status", status);
  if (service) query = query.ilike("service", `%${service}%`);

  const { data: leads, count } = await query;

  return (
    <LeadManager 
      leads={leads || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}

