export const dynamic = 'force-dynamic';
import { CustomerManager } from "@/components/admin/CustomerManager";
import { customersApi } from "@/lib/api/customers.api";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const tier = typeof params?.tier === 'string' ? params.tier : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  
  const response = await customersApi.getAdminCustomers({
    q: q || undefined,
    tier: tier || undefined,
    page,
    limit,
  });

  return (
    <CustomerManager 
      customers={(response.data as any) || []} 
      totalCount={response.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
