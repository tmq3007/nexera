import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the expected structure of our JWT
interface CustomJwtPayload {
  sub: string;
  email: string;
  type: 'admin' | 'customer';
  role?: string;
}

export async function updateSession(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Phân loại các route
  const isAdminRoute = url.pathname.startsWith('/admin');
  const isAdminAuthRoute = url.pathname === '/dang-nhap/admin';
  const isCustomerAuthRoute = url.pathname === '/dang-nhap' || url.pathname === '/dang-ky';
  const isCustomerProtectedRoute = url.pathname.startsWith('/tai-khoan') || url.pathname.startsWith('/thanh-toan');

  // Lấy token từ cookie (sau khi login, ta sẽ lưu JWT vào cookie tên là 'access_token')
  const token = request.cookies.get('access_token')?.value;

  let userPayload: CustomJwtPayload | null = null;

  if (token) {
    try {
      // Xác thực và giải mã JWT
      // Lưu ý: Trong môi trường thực tế, JWT_SECRET phải đồng nhất với backend
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key-please-change-in-production');
      const { payload } = await jwtVerify(token, secret);
      userPayload = payload as unknown as CustomJwtPayload;
    } catch (error) {
      // Token không hợp lệ hoặc đã hết hạn
      userPayload = null;
    }
  }

  // --- XỬ LÝ KHI NGƯỜI DÙNG ĐÃ ĐĂNG NHẬP ---
  if (userPayload) {
    const isAdmin = userPayload.type === 'admin';
    const isCustomer = userPayload.type === 'customer';

    // 1. Ngăn Khách hàng đi lạc vào Admin -> Chuyển về trang chủ yên lặng
    if (isAdminRoute && !isAdmin) {
      url.pathname = '/';
      url.searchParams.delete('error');
      return NextResponse.redirect(url);
    }

    // 2. Ngăn Admin đi lạc vào tính năng mua hàng cá nhân -> Chuyển về trang admin
    if (isCustomerProtectedRoute && !isCustomer) {
      url.pathname = '/admin';
      url.searchParams.delete('error');
      return NextResponse.redirect(url);
    }

    // 3. Đã login mà quay lại trang Login Admin
    if (isAdminAuthRoute) {
      if (isAdmin) url.pathname = '/admin';
      else url.pathname = '/'; 
      return NextResponse.redirect(url);
    }

    // 4. Đã login mà quay lại trang Login Khách hàng
    if (isCustomerAuthRoute) {
      url.pathname = isCustomer ? '/' : '/admin';
      return NextResponse.redirect(url);
    }
  } 
  // --- XỬ LÝ KHI CHƯA ĐĂNG NHẬP ---
  else {
    // Nếu token hết hạn hoặc không tồn tại, xóa cookie (tuỳ chọn)
    const response = NextResponse.next();
    if (token) {
      response.cookies.delete('access_token');
    }

    if (isAdminRoute) {
      url.pathname = '/dang-nhap/admin';
      return NextResponse.redirect(url);
    }
    if (isCustomerProtectedRoute) {
      url.pathname = '/dang-nhap';
      url.searchParams.set('redirect_to', url.pathname);
      return NextResponse.redirect(url);
    }

    return response;
  }

  return NextResponse.next();
}


