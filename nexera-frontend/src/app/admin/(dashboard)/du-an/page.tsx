export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { ProjectManager } from "@/components/admin/ProjectManager";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  
  const q = typeof params?.q === 'string' ? params.q : "";
  const page = typeof params?.page === 'string' ? parseInt(params.page, 10) : 1;
  const limit = typeof params?.limit === 'string' ? parseInt(params.limit, 10) : 10;
  
  const category = typeof params?.category === 'string' ? params.category : "";
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (category) query = query.eq("category", category);

  const { data: projects, count } = await query;

  return (
    <ProjectManager 
      projects={projects || []} 
      totalCount={count || 0}
      currentPage={page}
      itemsPerPage={limit}
    />
  );
}

