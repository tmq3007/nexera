import { getBackendUrl } from './config';
import { ApiError } from './errors';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, any> | FormData;
  params?: Record<string, string | number | boolean | undefined>;
  token?: string;            // JWT for authenticated requests
  revalidate?: number | false; // Next.js cache control
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, token, revalidate, ...fetchOptions } = options;
  const baseUrl = getBackendUrl();

  // Build URL with query params
  const url = new URL(endpoint, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Build headers
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (body && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Build fetch config with Next.js cache
  const config: RequestInit = {
    ...fetchOptions,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  };

  if (revalidate !== undefined) {
    if (revalidate === false) {
      config.cache = 'no-store';
    } else {
      (config as any).next = { revalidate };
    }
  }

  // Execute request
  const response = await fetch(url.toString(), config);

  // Handle errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, response.statusText, errorData, endpoint);
  }

  // Handle empty response (204 No Content)
  if (response.status === 204) return undefined as T;

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'GET' }),

  post: <T>(endpoint: string, body?: Record<string, any> | FormData, opts?: Omit<RequestOptions, 'body'>) =>
    apiClient<T>(endpoint, { ...opts, method: 'POST', body }),

  put: <T>(endpoint: string, body?: Record<string, any> | FormData, opts?: Omit<RequestOptions, 'body'>) =>
    apiClient<T>(endpoint, { ...opts, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: Record<string, any> | FormData, opts?: Omit<RequestOptions, 'body'>) =>
    apiClient<T>(endpoint, { ...opts, method: 'PATCH', body }),

  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    apiClient<T>(endpoint, { ...opts, method: 'DELETE' }),
};
