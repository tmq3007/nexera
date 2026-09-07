export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { OrderManager } from "@/components/admin/OrderManager";

export default async function AdminOrdersPage({
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
  const date = typeof params?.date === 'string' ? params.date : "";
  
  const customer_id = typeof params?.customer_id === 'string' ? params.customer_id : "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("orders")
    .select("*, customers(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    // Tìm theo mã đơn hàng hoặc tên khách hàng/email khách hàng (nếu có lookup - hiện Supabase text search không hỗ trợ join trực tiếp bằng ilike, nên ta tìm order code)
    query = query.ilike("id", `%${q}%`);
  }
  if (customer_id) query = query.eq("customer_id", customer_id);
  if (status) query = query.eq("status", status);
  if (date) {
    query = query
      .gte("created_at", `${date}T00:00:00.000Z`)
      .lte("created_at", `${date}T23:59:59.999Z`);
  }

  const { data: orders, count } = await query;

  return (
    <OrderManager 
      orders={orders || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}

