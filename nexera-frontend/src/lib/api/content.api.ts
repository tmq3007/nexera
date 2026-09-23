import { BACKEND_URL } from "./config";

// ===================== PROJECTS =====================
export interface ProjectItem {
  id: string;
  name: string;
  slug?: string | null;
  category: 'INDUSTRIAL' | 'RESIDENTIAL' | 'AGRICULTURAL' | 'SOLAR' | string;
  description?: string | null;
  image_url?: string | null;
  completion_date?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface GetProjectsResponse {
  data: ProjectItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== ARTICLES =====================
export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  type?: string;
  content?: string | null;
  image_url?: string | null;
  published_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface GetArticlesResponse {
  data: ArticleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== POLICIES =====================
export interface PolicyItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string;
  is_active: boolean;
  version?: {
    id: string;
    version_number: number;
    effective_date: string;
    change_summary?: string;
  } | null;
}

export const contentApi = {
  // ----------------- PROJECTS -----------------
  async getProjects(query: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<GetProjectsResponse> {
    try {
      const params = new URLSearchParams();
      if (query.category) params.set("category", query.category);
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", query.page.toString());
      if (query.limit) params.set("limit", query.limit.toString());

      const res = await fetch(`${BACKEND_URL}/projects?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      return await res.json();
    } catch (err) {
      console.error("Lỗi getProjects:", err);
      return { data: [], total: 0, page: 1, limit: 12, totalPages: 0 };
    }
  },

  async getProject(idOrSlug: string): Promise<ProjectItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/${idOrSlug}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getProject:", err);
      return null;
    }
  },

  async createProject(data: any): Promise<ProjectItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi createProject:", err);
      return null;
    }
  },

  async updateProject(id: string, data: any): Promise<ProjectItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/admin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi updateProject:", err);
      return null;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/projects/admin/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi deleteProject:", err);
      return false;
    }
  },

  // ----------------- ARTICLES -----------------
  async getArticles(query: {
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<GetArticlesResponse> {
    try {
      const params = new URLSearchParams();
      if (query.type) params.set("type", query.type);
      if (query.search) params.set("search", query.search);
      if (query.page) params.set("page", query.page.toString());
      if (query.limit) params.set("limit", query.limit.toString());

      const res = await fetch(`${BACKEND_URL}/articles?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
      return await res.json();
    } catch (err) {
      console.error("Lỗi getArticles:", err);
      return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    }
  },

  async getArticle(idOrSlug: string): Promise<ArticleItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/articles/${idOrSlug}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getArticle:", err);
      return null;
    }
  },

  async createArticle(data: any): Promise<ArticleItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/articles/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi createArticle:", err);
      return null;
    }
  },

  async updateArticle(id: string, data: any): Promise<ArticleItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/articles/admin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi updateArticle:", err);
      return null;
    }
  },

  async deleteArticle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/articles/admin/${id}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi deleteArticle:", err);
      return false;
    }
  },

  // ----------------- POLICIES -----------------
  async getActivePolicies(): Promise<PolicyItem[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getActivePolicies:", err);
      return [];
    }
  },

  async getPolicyBySlug(slug: string): Promise<PolicyItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/${slug}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getPolicyBySlug:", err);
      return null;
    }
  },

  async updatePolicy(id: string, data: any): Promise<PolicyItem | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi updatePolicy:", err);
      return null;
    }
  },

  async getAllPoliciesAdmin(): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/list`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getAllPoliciesAdmin:", err);
      return [];
    }
  },

  async getPolicyVersions(policyId: string): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/${policyId}/versions`, {
        cache: "no-store",
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.error("Lỗi getPolicyVersions:", err);
      return [];
    }
  },

  async togglePolicyStatus(id: string, isActive: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/${id}/toggle-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi togglePolicyStatus:", err);
      return false;
    }
  },

  async publishNewVersion(id: string, versionName: string, content: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/${id}/publish-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionName, content }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi publishNewVersion:", err);
      return null;
    }
  },

  async activateVersion(id: string, versionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/${id}/activate-version/${versionId}`, {
        method: "PATCH",
      });
      return res.ok;
    } catch (err) {
      console.error("Lỗi activateVersion:", err);
      return false;
    }
  },

  // ----------------- BUSINESS INFO -----------------
  async getBusinessInfo(): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/business-info`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Lỗi getBusinessInfo:", err);
      return null;
    }
  },

  async saveBusinessInfo(payload: any): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/policies/admin/business-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Lỗi lưu thông tin doanh nghiệp");
      }
      return await res.json();
    } catch (err) {
      console.error("Lỗi saveBusinessInfo:", err);
      throw err;
    }
  },
};

