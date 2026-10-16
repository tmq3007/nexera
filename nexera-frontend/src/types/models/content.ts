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

export interface GetProjectsQuery {
  category?: string;
  search?: string;
  sort?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
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

export interface GetArticlesQuery {
  type?: string;
  search?: string;
  date?: string;
  sort?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
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
