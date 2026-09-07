export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { ArticleManager } from "@/components/admin/ArticleManager";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  
  const date = typeof params?.date === 'string' ? params.date : "";
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("articles")
    .select("*", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("title", `%${q}%`);
  }
  if (date) {
    query = query
      .gte("published_at", `${date}T00:00:00.000Z`)
      .lte("published_at", `${date}T23:59:59.999Z`);
  }

  const { data: articles, count } = await query;

  return (
    <ArticleManager 
      articles={articles || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}

