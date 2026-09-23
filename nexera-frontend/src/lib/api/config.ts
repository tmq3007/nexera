// Cấu hình URL Backend linh hoạt giữa Server-side (Docker network) và Client-side (Browser)
export const getBackendUrl = (): string => {
  if (typeof window === 'undefined') {
    // Chạy trên Server (SSR, Server Component, Server Action)
    return (
      process.env.INTERNAL_BACKEND_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      (process.env.NODE_ENV === 'production' ? 'http://backend:4000' : 'http://localhost:4000')
    );
  }
  // Chạy trên trình duyệt của người dùng (Client-side)
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
};

export const BACKEND_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:4000' : 'http://localhost:4000'))
  : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000');
