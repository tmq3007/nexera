'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const getBackendUrl = () => {
  return (
    process.env.INTERNAL_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://backend:4000' : 'http://localhost:4000')
  );
};

export async function loginAdminAction(email: string, password: string) {
  try {
    const res = await fetch(`${getBackendUrl()}/auth/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || 'Đăng nhập thất bại' };
    }

    if (data.access_token) {
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      return { success: true };
    }

    return { error: 'Lỗi không xác định' };
  } catch (err: any) {
    return { error: err.message || 'Lỗi kết nối tới máy chủ' };
  }
}

export async function loginCustomerAction(email: string, password: string) {
  try {
    const res = await fetch(`${getBackendUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || 'Đăng nhập thất bại' };
    }

    if (data.access_token) {
      // Set HTTP-only cookie
      const cookieStore = await cookies();
      cookieStore.set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return { success: true };
    }

    return { error: 'Lỗi không xác định' };
  } catch (err: any) {
    return { error: err.message || 'Lỗi kết nối tới máy chủ' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  redirect('/');
}

import { jwtVerify } from 'jose';

export async function getUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) return { data: { user: null }, error: null };

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-please-change-in-production');
    const { payload } = await jwtVerify(token, secret);
    
    // Map custom JWT payload to Supabase-like user object so we don't have to rewrite everything
    return {
      data: {
        user: {
          id: payload.sub as string,
          email: payload.email as string,
          user_metadata: {
            full_name: payload.email?.toString().split('@')[0],
          },
          role: payload.type === 'admin' ? 'admin' : 'authenticated',
          app_metadata: {
            type: payload.type,
            role_name: payload.role,
          }
        }
      },
      error: null
    };
  } catch (err) {
    return { data: { user: null }, error: new Error('Token không hợp lệ') };
  }
}
