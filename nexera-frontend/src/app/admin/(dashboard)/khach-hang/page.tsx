export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { CustomerManager } from "@/components/admin/CustomerManager";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const tier = typeof params?.tier === 'string' ? params.tier : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("customers")
    .select(
      "*, orders(id, total_amount, status, created_at), customer_notes(*), conversations(id, status, last_message_preview, last_message_at)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // Tìm kiếm theo tên, email, hoặc sđt
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  if (tier) {
    query = query.eq("tier", tier);
  }

  const { data: customers, count } = await query;

  return (
    <CustomerManager 
      customers={customers || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
