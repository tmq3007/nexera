import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics.api';
import { useAuth } from '@/contexts/AuthContext';
import type { GetActivityLogsQuery } from '@/lib/api/analytics.api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  activityLogs: (query: GetActivityLogsQuery) => [...analyticsKeys.all, 'logs', query] as const,
};

export function useDashboardOverview() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analyticsApi.getDashboardOverview(accessToken!),
    enabled: !!accessToken,
  });
}

export function useActivityLogs(query: GetActivityLogsQuery = {}) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: analyticsKeys.activityLogs(query),
    queryFn: () => analyticsApi.getActivityLogs(query, accessToken!),
    enabled: !!accessToken,
  });
}
