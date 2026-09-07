export const dynamic = 'force-dynamic';
import { createClient } from "@/utils/supabase/server";
import { ActivityLogManager } from "@/components/admin/ActivityLogManager";

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = parseInt((resolvedParams.page as string) || "1", 10);
  const q = (resolvedParams.q as string) || "";
  const entityType = (resolvedParams.entity_type as string) || "";
  const severity = (resolvedParams.severity as string) || "";

  const pageSize = 15;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  let query = supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`action.ilike.%${q}%,user_email.ilike.%${q}%,entity_id.ilike.%${q}%`);
  }
  if (entityType && entityType !== "all") {
    query = query.eq("entity_type", entityType);
  }
  if (severity && severity !== "all") {
    query = query.eq("severity", severity);
  }

  const { data: logs, count } = await query;

  return <ActivityLogManager logs={logs || []} count={count || 0} />;
}
