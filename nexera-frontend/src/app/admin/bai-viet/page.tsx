import { createClient } from "@/utils/supabase/server";
import { ArticleManager } from "@/components/admin/ArticleManager";

export default async function AdminArticlesPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  return <ArticleManager articles={articles || []} />;
}

