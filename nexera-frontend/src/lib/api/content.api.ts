import { api } from './client';
import type { PaginatedResponse } from '@/types/api';
import type {
  ProjectItem,
  GetProjectsQuery,
  ArticleItem,
  GetArticlesQuery,
  PolicyItem
} from '@/types/models/content';

// Re-export types for backward compatibility
export type { ProjectItem, GetProjectsQuery, ArticleItem, GetArticlesQuery, PolicyItem } from '@/types/models/content';
export type { PaginatedResponse as GetProjectsResponse } from '@/types/api';
export type { PaginatedResponse as GetArticlesResponse } from '@/types/api';

export const contentApi = {
  // ----------------- PROJECTS -----------------
  getProjects: (query: GetProjectsQuery = {}) =>
    api.get<PaginatedResponse<ProjectItem>>('/projects', {
      params: query as Record<string, string | number | boolean | undefined>,
      revalidate: false,
    }),

  getProject: (idOrSlug: string) =>
    api.get<ProjectItem | null>(`/projects/${idOrSlug}`, {
      revalidate: false,
    }),

  createProject: (data: any, token: string) =>
    api.post<ProjectItem>('/projects/admin', data, { token }),

  updateProject: (id: string, data: any, token: string) =>
    api.put<ProjectItem>(`/projects/admin/${id}`, data, { token }),

  deleteProject: (id: string, token: string) =>
    api.delete<void>(`/projects/admin/${id}`, { token }).then(() => true),

  // ----------------- ARTICLES -----------------
  getArticles: (query: GetArticlesQuery = {}) =>
    api.get<PaginatedResponse<ArticleItem>>('/articles', {
      params: query as Record<string, string | number | boolean | undefined>,
      revalidate: false,
    }),

  getArticle: (idOrSlug: string) =>
    api.get<ArticleItem | null>(`/articles/${idOrSlug}`, {
      revalidate: false,
    }),

  createArticle: (data: any, token: string) =>
    api.post<ArticleItem>('/articles/admin', data, { token }),

  updateArticle: (id: string, data: any, token: string) =>
    api.put<ArticleItem>(`/articles/admin/${id}`, data, { token }),

  deleteArticle: (id: string, token: string) =>
    api.delete<void>(`/articles/admin/${id}`, { token }).then(() => true),

  // ----------------- POLICIES -----------------
  getActivePolicies: () =>
    api.get<PolicyItem[]>('/policies', { revalidate: 60 }),

  getPolicyBySlug: (slug: string) =>
    api.get<PolicyItem | null>(`/policies/${slug}`, { revalidate: false }),

  updatePolicy: (id: string, data: any, token: string) =>
    api.put<PolicyItem>(`/policies/admin/${id}`, data, { token }),

  getAllPoliciesAdmin: (token: string) =>
    api.get<any[]>('/policies/admin/list', { token, revalidate: false }),

  getPolicyVersions: (policyId: string, token: string) =>
    api.get<any[]>(`/policies/admin/${policyId}/versions`, { token, revalidate: false }),

  togglePolicyStatus: (id: string, isActive: boolean, token: string) =>
    api.patch<void>(`/policies/admin/${id}/toggle-status`, { isActive }, { token }).then(() => true),

  publishNewVersion: (id: string, versionName: string, content: string, token: string) =>
    api.post<any>(`/policies/admin/${id}/publish-version`, { versionName, content }, { token }),

  activateVersion: (id: string, versionId: string, token: string) =>
    api.patch<void>(`/policies/admin/${id}/activate-version/${versionId}`, {}, { token }).then(() => true),

  // ----------------- BUSINESS INFO -----------------
  getBusinessInfo: () =>
    api.get<any>('/policies/business-info', { revalidate: false }),

  saveBusinessInfo: (payload: any, token: string) =>
    api.post<any>('/policies/admin/business-info', payload, { token }),
};
