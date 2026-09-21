export const dynamic = 'force-dynamic';
import { OrderManager } from "@/components/admin/OrderManager";
import { ordersApi } from "@/lib/api/orders.api";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  const status = typeof params?.status === 'string' ? params.status : "";

  const response = await ordersApi.getAdminOrders({
    search: q || undefined,
    status: status || undefined,
    page,
    limit,
  });

  return (
    <OrderManager 
      orders={(response.data as any) || []} 
      totalCount={response.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
