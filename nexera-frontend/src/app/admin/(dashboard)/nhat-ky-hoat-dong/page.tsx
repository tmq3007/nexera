export const dynamic = 'force-dynamic';
import { analyticsApi } from "@/lib/api/analytics.api";
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

  const response = await analyticsApi.getActivityLogs({
    page,
    pageSize: 15,
    q,
    entityType,
    severity,
  });

  return <ActivityLogManager logs={(response.logs as any) || []} count={response.total || 0} />;
}

