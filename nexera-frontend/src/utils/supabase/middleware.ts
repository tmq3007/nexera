import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // This will refresh the session if expired and emit the cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Phân loại các route
  const isAdminRoute = url.pathname.startsWith('/admin')
  const isAdminAuthRoute = url.pathname === '/dang-nhap/admin'
  const isCustomerAuthRoute = url.pathname === '/dang-nhap' || url.pathname === '/dang-ky'
  const isCustomerProtectedRoute = url.pathname.startsWith('/tai-khoan') || url.pathname.startsWith('/thanh-toan')

  // Nếu không truy cập các route nhạy cảm, chỉ cần refresh token và tiếp tục
  if (!isAdminRoute && !isAdminAuthRoute && !isCustomerAuthRoute && !isCustomerProtectedRoute) {
    return supabaseResponse
  }

  // --- XỬ LÝ KHI NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ---
  if (user) {
    // Truy vấn Role từ CSDL (Chỉ gọi khi thực sự cần check quyền truy cập)
    const [adminRes, customerRes] = await Promise.all([
      supabase.from('admin_accounts').select('id').eq('auth_user_id', user.id).single(),
      supabase.from('customers').select('id').eq('auth_user_id', user.id).single()
    ])
    const isAdmin = !!adminRes.data;
    const isCustomer = !!customerRes.data;

    // 1. Ngăn Khách hàng đi lạc vào Admin -> Chuyển về trang chủ yên lặng
    if (isAdminRoute && !isAdmin) {
      url.pathname = '/'
      url.searchParams.delete('error')
      return NextResponse.redirect(url)
    }

    // 2. Ngăn Admin đi lạc vào tính năng mua hàng cá nhân -> Chuyển về trang admin
    if (isCustomerProtectedRoute && !isCustomer) {
      url.pathname = '/admin'
      url.searchParams.delete('error')
      return NextResponse.redirect(url)
    }

    // 3. Đã login mà quay lại trang Login Admin
    if (isAdminAuthRoute) {
      if (isAdmin) url.pathname = '/admin' // Đúng người
      else url.pathname = '/' // Khách hàng vào nhầm link login Admin
      url.searchParams.delete('error')
      return NextResponse.redirect(url)
    }

    // 4. Đã login mà quay lại trang Login Khách hàng
    if (isCustomerAuthRoute) {
      url.pathname = isCustomer ? '/' : '/admin'
      url.searchParams.delete('error')
      return NextResponse.redirect(url)
    }
  } 
  // --- XỬ LÝ KHI CHƯA ĐĂNG NHẬP ---
  else {
    if (isAdminRoute) {
      url.pathname = '/dang-nhap/admin'
      return NextResponse.redirect(url)
    }
    if (isCustomerProtectedRoute) {
      url.pathname = '/dang-nhap'
      url.searchParams.set('redirect_to', url.pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
