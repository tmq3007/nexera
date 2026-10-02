import { useQuery } from '@tanstack/react-query';
import { contentApi } from '@/lib/api/content.api';
import type { GetProjectsQuery, GetArticlesQuery } from '@/types/models/content';

export const contentKeys = {
  projects: {
    all: ['projects'] as const,
    list: (query: GetProjectsQuery) => ['projects', 'list', query] as const,
    detail: (idOrSlug: string) => ['projects', 'detail', idOrSlug] as const,
  },
  articles: {
    all: ['articles'] as const,
    list: (query: GetArticlesQuery) => ['articles', 'list', query] as const,
    detail: (idOrSlug: string) => ['articles', 'detail', idOrSlug] as const,
  },
  policies: {
    all: ['policies'] as const,
    active: () => ['policies', 'active'] as const,
    bySlug: (slug: string) => ['policies', 'slug', slug] as const,
  },
};

export function useProjects(query: GetProjectsQuery = {}) {
  return useQuery({
    queryKey: contentKeys.projects.list(query),
    queryFn: () => contentApi.getProjects(query),
  });
}

export function useProjectDetail(idOrSlug: string) {
  return useQuery({
    queryKey: contentKeys.projects.detail(idOrSlug),
    queryFn: () => contentApi.getProject(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useArticles(query: GetArticlesQuery = {}) {
  return useQuery({
    queryKey: contentKeys.articles.list(query),
    queryFn: () => contentApi.getArticles(query),
  });
}

export function useArticleDetail(idOrSlug: string) {
  return useQuery({
    queryKey: contentKeys.articles.detail(idOrSlug),
    queryFn: () => contentApi.getArticle(idOrSlug),
    enabled: !!idOrSlug,
  });
}

export function useActivePolicies() {
  return useQuery({
    queryKey: contentKeys.policies.active(),
    queryFn: () => contentApi.getActivePolicies(),
  });
}

export function usePolicyBySlug(slug: string) {
  return useQuery({
    queryKey: contentKeys.policies.bySlug(slug),
    queryFn: () => contentApi.getPolicyBySlug(slug),
    enabled: !!slug,
  });
}
