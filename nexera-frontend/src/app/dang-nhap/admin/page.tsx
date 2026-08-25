"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Image */}
      <Image 
        src="/admin-bg.png" 
        alt="Nexera Admin Background" 
        fill 
        priority
        className="object-cover z-0"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#13426E]/70 z-0"></div>

      {/* Back to Home Button */}
      <a 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium transition-all"
      >
        <span className="text-[#80BF49]">←</span>
        <span>Về trang chủ</span>
      </a>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col md:flex-row w-full min-h-screen">
        
        {/* Left Side - Text & Branding */}
        <div className="flex-1 flex flex-col justify-center p-8 md:p-16 lg:p-24 text-white">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-12 h-12 text-[#80BF49]" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">NEXERA</h1>
            </div>
            <h2 className="text-3xl md:text-4xl font-light mb-6">
              Hệ thống quản trị nội bộ <br />
              <span className="font-bold text-[#80BF49]">Nexera Group</span>
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl">
              Nền tảng quản lý tập trung các dịch vụ điện mặt trời, công nghệ thông minh và phát triển bền vững. Xin vui lòng đăng nhập để tiếp tục.
            </p>
            <div className="hidden md:flex items-center text-white/50 text-sm">
              <span className="mr-4">Bảo mật bởi Supabase Auth</span>
              <div className="h-px bg-white/20 w-16"></div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form (No border frame, blending) */}
        <div className="w-full md:w-[480px] lg:w-[540px] bg-black/20 backdrop-blur-md flex flex-col justify-center p-8 md:p-12 lg:p-16">
          <div className="w-full max-w-sm mx-auto">
            <h3 className="text-2xl font-bold text-white mb-2">Đăng nhập</h3>
            <p className="text-white/60 mb-8">Vui lòng nhập thông tin xác thực.</p>

            <form onSubmit={handleLogin} className="space-y-6">
              
              {error && (
                <div className="p-3 bg-red-500/20 border-l-4 border-red-500 text-white text-sm">
                  {error === "Invalid login credentials" ? "Email hoặc mật khẩu không chính xác." : error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Email đăng nhập</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/40" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexera.vn"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border-b-2 border-white/10 focus:border-[#80BF49] text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white/40" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white/5 border-b-2 border-white/10 focus:border-[#80BF49] text-white placeholder-white/30 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#80BF49] hover:bg-[#9ad166] text-[#13426E] font-bold transition-all disabled:opacity-70 flex items-center justify-between px-6"
              >
                <span>
                  {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                </span>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#13426E]" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
