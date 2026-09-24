"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customersApi } from "@/lib/api/customers.api";
import { loginCustomerAction } from "@/app/actions/auth";
import { UserCircle2, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Home } from "lucide-react";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await loginCustomerAction(email, password);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res.success) {
      // (Bỏ qua đồng bộ profile guest chat ở bước đăng nhập vì payload JWT mới chưa cấp đủ data, hoặc cần gọi API '/api/me' sau, tạm thời skip bước chat sync)
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#13426E]">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80')" 
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#13426E]/95 via-[#13426E]/80 to-[#80BF49]/20 z-0"></div>

      {/* Back to Home Button (Top Left) */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium transition-all"
      >
        <Home className="w-4 h-4 text-[#80BF49]" />
        <span>Về trang chủ</span>
      </Link>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col md:flex-row w-full min-h-screen">
        
        {/* Left Side - Text & Branding */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8 md:p-16 lg:p-24 text-white pt-20 md:pt-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <UserCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#80BF49]" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">NEXERA</h1>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-light mb-3 sm:mb-6 leading-tight">
              Chào mừng bạn đến với <br />
              <span className="font-bold text-[#80BF49]">Hệ sinh thái giải pháp xanh</span>
            </h2>
            <p className="hidden sm:block text-white/80 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
              Đăng nhập để theo dõi đơn hàng, quản lý sản phẩm thông minh và trải nghiệm dịch vụ cá nhân hóa từ Nexera.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-[480px] lg:w-[540px] bg-white/10 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/20 flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6 sm:mb-8 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2">Đăng nhập</h3>
              <p className="text-white/70 text-xs sm:text-sm">Dành cho Khách hàng & Đối tác</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-xl text-white text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@nexera.vn"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 focus:ring-1 focus:ring-[#80BF49] text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-1.5">Mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 focus:ring-1 focus:ring-[#80BF49] text-white placeholder-white/30 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-[#80BF49] hover:bg-[#9ad166] text-[#13426E] font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-between px-6 shadow-lg shadow-[#80BF49]/20"
              >
                <span className="text-base font-bold">
                  {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                </span>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#13426E]" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-white/70 text-sm">
                Chưa có tài khoản?{" "}
                <Link href="/dang-ky" className="text-[#80BF49] font-bold hover:underline transition-colors">
                  Đăng ký ngay
                </Link>
              </p>
              <div className="pt-2 border-t border-white/10">
                <Link 
                  href="/dang-nhap/admin" 
                  className="text-xs text-white/50 hover:text-[#80BF49] transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Dành cho Quản trị viên hệ thống</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
