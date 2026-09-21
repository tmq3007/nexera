export const dynamic = 'force-dynamic';
import { ProjectManager } from "@/components/admin/ProjectManager";
import { contentApi } from "@/lib/api/content.api";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  const category = typeof params?.category === 'string' ? params.category : "";

  const response = await contentApi.getProjects({
    search: q || undefined,
    category: category || undefined,
    page,
    limit,
  });

  return (
    <ProjectManager 
      projects={(response.data as any) || []} 
      totalCount={response.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
