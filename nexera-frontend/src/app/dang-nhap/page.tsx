"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, UserCircle2, ArrowRight, Home } from "lucide-react";
import Link from "next/link";

export default function CustomerLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email hoặc mật khẩu không chính xác." : error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 1. Tìm customer profile theo auth_user_id hoặc email
      let customerId: string | null = null;
      let existingPhones: string[] = [];
      let existingEmails: string[] = [];
      let existingPhone: string | null = null;
      let existingEmail: string | null = null;

      const { data: custList } = await supabase
        .from("customers")
        .select("id, phone, email, phone_numbers, emails, auth_user_id")
        .or(`auth_user_id.eq.${data.user.id},email.eq.${data.user.email}`)
        .limit(1);

      if (custList && custList.length > 0) {
        const cust = custList[0];
        customerId = cust.id;
        existingPhone = cust.phone || null;
        existingEmail = cust.email || null;
        existingPhones = Array.isArray(cust.phone_numbers) ? [...cust.phone_numbers] : [];
        existingEmails = Array.isArray(cust.emails) ? [...cust.emails] : [];

        // Nếu auth_user_id chưa liên kết thì cập nhật
        if (cust.auth_user_id !== data.user.id) {
          await supabase
            .from("customers")
            .update({ auth_user_id: data.user.id })
            .eq("id", cust.id);
        }
      } else {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({
            auth_user_id: data.user.id,
            email: data.user.email,
            emails: data.user.email ? [data.user.email] : [],
            full_name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Khách hàng",
          })
          .select("id")
          .single();

        if (newCust) {
          customerId = newCust.id;
        }
      }

      // 2. Tự động đồng bộ phiên chat vãng lai và gộp toàn bộ lịch sử trò chuyện
      const guestSessionId = typeof window !== "undefined" ? localStorage.getItem("nexera_chat_guest_session") : null;
      const guestPhone = typeof window !== "undefined" ? localStorage.getItem("nexera_chat_guest_phone") : null;
      const guestEmail = typeof window !== "undefined" ? localStorage.getItem("nexera_chat_guest_email") : null;
      const customerFullName = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Khách hàng";

      if (guestSessionId) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
          await fetch(`${backendUrl}/chat/sync-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestSessionId,
              customerId,
              authUserId: data.user.id,
              email: data.user.email,
              fullName: customerFullName,
              phone: guestPhone || existingPhone || undefined,
            }),
          });
        } catch (syncErr) {
          console.error("Lỗi đồng bộ chat khi đăng nhập:", syncErr);
        }
      }

      if (customerId) {
        let needsUpdate = false;
        if (guestPhone && !existingPhones.includes(guestPhone)) {
          existingPhones.push(guestPhone);
          needsUpdate = true;
        }
        if (guestEmail && !existingEmails.includes(guestEmail)) {
          existingEmails.push(guestEmail);
          needsUpdate = true;
        }

        if (needsUpdate) {
          await supabase
            .from("customers")
            .update({
              phone: existingPhone || guestPhone || undefined,
              email: existingEmail || guestEmail || undefined,
              phone_numbers: existingPhones,
              emails: existingEmails,
            })
            .eq("id", customerId);
        }
      }

      window.location.href = "/";
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
      setError("Không thể đăng nhập bằng Google. Vui lòng thử lại.");
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
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 text-white pt-24 md:pt-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <UserCircle2 className="w-12 h-12 text-[#80BF49]" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">NEXERA</h1>
            </div>
            <h2 className="text-3xl md:text-4xl font-light mb-6 leading-tight">
              Chào mừng bạn đến với <br />
              <span className="font-bold text-[#80BF49]">Hệ sinh thái giải pháp xanh</span>
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl leading-relaxed">
              Đăng nhập để theo dõi đơn hàng, quản lý sản phẩm thông minh và trải nghiệm dịch vụ cá nhân hóa từ Nexera.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-[480px] lg:w-[540px] bg-white/10 backdrop-blur-xl border-l border-white/20 flex flex-col justify-center p-8 md:p-12 lg:p-16 shadow-2xl">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-8 text-center md:text-left">
              <h3 className="text-3xl font-bold text-white mb-2">Đăng nhập</h3>
              <p className="text-white/70 text-sm">Dành cho Khách hàng & Đối tác</p>
            </div>

            {/* Google OAuth Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
              className="w-full mb-6 py-3.5 px-4 bg-white hover:bg-gray-50 text-[#13426E] font-semibold rounded-xl transition-all flex items-center justify-center gap-3 shadow-md border border-gray-200"
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
              <span>Tiếp tục với Google</span>
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="border-t border-white/20 w-full"></div>
              <span className="bg-[#13426E] px-3 text-xs text-white/60 uppercase font-bold tracking-wider">hoặc</span>
              <div className="border-t border-white/20 w-full"></div>
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
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:border-[#80BF49] focus:bg-white/10 focus:ring-1 focus:ring-[#80BF49] text-white placeholder-white/30 transition-all outline-none"
                  />
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
