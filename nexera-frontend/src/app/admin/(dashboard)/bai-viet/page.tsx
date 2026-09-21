export const dynamic = 'force-dynamic';
import { ArticleManager } from "@/components/admin/ArticleManager";
import { contentApi } from "@/lib/api/content.api";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;

  const res = await contentApi.getArticles({
    search: q || undefined,
    page,
    limit,
  });

  return (
    <ArticleManager 
      articles={(res.data as any) || []} 
      totalCount={res.total || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}
