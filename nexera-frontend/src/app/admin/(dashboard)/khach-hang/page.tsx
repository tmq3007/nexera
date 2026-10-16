export const dynamic = 'force-dynamic';
import { CustomerManager } from "@/components/admin/CustomerManager";
import { customersApi } from "@/lib/api/customers.api";
import { getServerToken } from "@/lib/auth/server";

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
  
  const token = await getServerToken();

  const response = await customersApi.getAdminCustomers({
    q: q || undefined,
    tier: tier || undefined,
    page,
    limit,
  }, token!);

  return (
    <CustomerManager 
      customers={(response?.data as any) || (response as any)?.customers || []} 
      totalCount={response?.total ?? (response as any)?.totalCount ?? 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
