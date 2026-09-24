"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User, Phone, UserCircle2, ArrowRight, Home, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { customersApi } from "@/lib/api/customers.api";

export default function CustomerRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Đảm bảo insert/sync profile khách hàng qua Backend API
      try {
        const guestSessionId = typeof window !== "undefined" ? localStorage.getItem("nexera_chat_guest_session") : null;
        await customersApi.syncProfile({
          authUserId: data.user.id,
          fullName: fullName,
          email: email,
          phone: phone || undefined,
          guestSessionId: guestSessionId || undefined,
        });
      } catch (err) {
        console.error("Lỗi tạo hồ sơ khách hàng:", err);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    }
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError("Không thể đăng ký bằng Google. Vui lòng thử lại.");
      setOauthLoading(false);
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

      {/* Back to Home Button */}
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
              Tham gia cộng đồng <br />
              <span className="font-bold text-[#80BF49]">Năng lượng & Công nghệ xanh</span>
            </h2>
            <p className="hidden sm:block text-white/80 text-base md:text-lg mb-8 max-w-xl leading-relaxed">
              Tạo tài khoản ngay để nhận ưu đãi thành viên, dễ dàng theo dõi tiến độ thi công và quản lý đơn hàng.
            </p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full md:w-[500px] lg:w-[560px] bg-white/10 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white/20 flex flex-col justify-center p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl overflow-y-auto">
          <div className="w-full max-w-sm mx-auto my-auto">
            <div className="mb-4 sm:mb-6 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 sm:mb-2">Đăng ký tài khoản</h3>
              <p className="text-white/70 text-xs sm:text-sm">Tạo tài khoản khách hàng mới</p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              className="w-full mb-5 py-3.5 px-4 bg-white hover:bg-gray-50 text-[#13426E] font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-md border border-gray-200"
            >
              {oauthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#13426E]" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>Đăng ký với Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-white/20 w-full"></div>
              <span className="bg-[#13426E] px-3 text-xs text-white/60 uppercase font-bold tracking-wider">hoặc</span>
              <div className="border-t border-white/20 w-full"></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-xl text-white text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3.5 bg-[#80BF49]/30 backdrop-blur-md border border-[#80BF49] rounded-xl text-white text-sm font-semibold text-center">
                  Đăng ký thành công! Đang chuyển hướng...
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Họ và tên</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 text-sm text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 text-sm text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Số điện thoại (tùy chọn)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0901234567"
                    className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 text-sm text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 text-sm text-white placeholder-white/30 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/90 mb-1">Xác nhận mật khẩu</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-white/50 group-focus-within:text-[#80BF49] transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    className="block w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 text-sm text-white placeholder-white/30 transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/50 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-3.5 mt-4 bg-[#80BF49] hover:bg-[#9ad166] text-[#13426E] font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-between px-6 shadow-lg shadow-[#80BF49]/20"
              >
                <span className="text-base font-bold">
                  {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                </span>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#13426E]" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white/70 text-sm">
                Đã có tài khoản?{" "}
                <Link href="/dang-nhap" className="text-[#80BF49] font-bold hover:underline transition-colors">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
