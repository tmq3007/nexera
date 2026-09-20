"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ChevronDown, ShoppingCart, User, LogOut } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { MiniCart } from "@/components/storefront/MiniCart";
import { ConfirmLogoutModal } from "@/components/ui/ConfirmLogoutModal";

const AUTH_STORAGE_KEY = "nexera_auth_session";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<{name: string, slug: string}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cartTotalItems = useCartStore((state) => state.totalItems());
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);

    // 1. Tải tức thì trạng thái đã lưu từ cache client (0ms) để không bị giật icon khi F5
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.isAuth) {
          setIsAuth(true);
          setIsAdmin(Boolean(parsed.isAdmin));
          setIsCustomer(Boolean(parsed.isCustomer));
          if (parsed.customerName) setCustomerName(parsed.customerName);
          setAuthLoading(false);
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }

    async function fetchData() {
      try {
        // Lấy danh mục sản phẩm
        const { data: catData } = await supabase.from("categories").select("name, slug");
        if (catData) setCategories(catData);

        // Kiểm tra phiên đăng nhập từ Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuth(true);
          const [adminRes, customerRes] = await Promise.all([
            supabase.from("admin_accounts").select("id, display_name").eq("auth_user_id", user.id).maybeSingle(),
            supabase.from("customers").select("id, full_name").eq("auth_user_id", user.id).maybeSingle()
          ]);
          
          if (adminRes.data) {
            setIsAdmin(true);
            setIsCustomer(false);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              isAuth: true,
              isAdmin: true,
              isCustomer: false,
              customerName: "",
            }));
          } else {
            setIsAdmin(false);
            setIsCustomer(true);
            const name = customerRes.data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Khách hàng";
            setCustomerName(name);

            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              isAuth: true,
              isAdmin: false,
              isCustomer: true,
              customerName: name,
            }));

            // Tự động đảm bảo tạo hồ sơ customer nếu chưa có trong DB
            if (!customerRes.data) {
              await supabase.from("customers").insert({
                auth_user_id: user.id,
                email: user.email,
                full_name: name,
              });
            }
          }
        } else {
          // Phiên đã kết thúc hoặc chưa đăng nhập
          setIsAuth(false);
          setIsAdmin(false);
          setIsCustomer(false);
          setCustomerName("");
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (err) {
        console.error("Lỗi kiểm tra phiên:", err);
      } finally {
        setAuthLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setIsAdmin(false);
      setIsCustomer(false);
      setIsAuth(false);
      setShowLogoutConfirm(false);
      window.location.href = "/";
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      {/* Main Header */}
      <div className="container mx-auto px-4 relative">
        <div className="flex h-[70px] md:h-[90px] items-center justify-between">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-[#13426E]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Image 
               src="/Logo-slogan.png" 
               alt={siteConfig.name} 
               width={230} 
               height={76} 
               className="h-[48px] md:h-[70px] w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-end items-center gap-6 xl:gap-8 mr-6">
            {siteConfig.navigation.map((item) => {
              let dropdownItems = item.items;
              if (item.title === "Sản phẩm") {
                dropdownItems = categories.length > 0 
                  ? categories.map(c => ({ title: c.name, href: `/san-pham?category=${c.slug}` }))
                  : item.items;
              }

              // Responsive dropdown layout based on items count
              let dropdownWidthClass = "w-64 left-0";
              let gridClass = "space-y-1";
              let maxHClass = "";
              let isMega = false;
              
              if (dropdownItems) {
                if (dropdownItems.length > 12) {
                   dropdownWidthClass = "w-[850px] left-1/2 -translate-x-1/2";
                   gridClass = "grid grid-cols-3 gap-x-4 gap-y-1";
                   maxHClass = "max-h-[70vh] overflow-y-auto"; // Thêm scroll nếu quá dài
                   isMega = true;
                } else if (dropdownItems.length > 6) {
                   dropdownWidthClass = "w-[600px] left-1/2 -translate-x-1/2";
                   gridClass = "grid grid-cols-2 gap-x-4 gap-y-1";
                   isMega = true;
                }
              }

              return (
                <div key={item.title} className="relative group">
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      className="text-[#13426E] font-extrabold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1.5 text-base xl:text-lg tracking-wide"
                    >
                      {item.title}
                      {dropdownItems && <ChevronDown className="h-4.5 w-4.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />}
                    </Link>
                  ) : (
                    <button className="text-[#13426E] font-extrabold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1.5 text-base xl:text-lg tracking-wide">
                      {item.title}
                      {dropdownItems && <ChevronDown className="h-4.5 w-4.5 opacity-70 group-hover:rotate-180 transition-transform duration-200" />}
                    </button>
                  )}
                  
                  {/* Dropdown Menu */}
                  {dropdownItems && (
                    <div className={`absolute top-full hidden group-hover:block pt-2 z-50 ${dropdownWidthClass}`}>
                      <div className={`bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100/80 overflow-hidden p-3 ${maxHClass} custom-scrollbar`}>
                        <ul className={gridClass}>
                        {dropdownItems.map((subItem) => (
                          <li key={subItem.title}>
                            <Link 
                              href={subItem.href} 
                              className={`block px-4 py-3 text-sm text-[#13426E] uppercase font-extrabold hover:bg-[#F0F7FB] hover:text-[#80BF49] rounded-xl transition-all ${isMega ? 'truncate' : ''}`}
                              title={subItem.title}
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2.5">
             {!mounted || authLoading ? (
               // Skeleton loader nhẹ nhàng cùng kích thước (36px), giữ vị trí không bị giật hay xô lệch
               <div className="w-9 h-9 rounded-full bg-gray-100/80 animate-pulse border border-gray-200/50" />
             ) : isAuth ? (
               isAdmin ? (
                 <div className="flex items-center gap-2">
                   <Link 
                     href="/admin"
                     className="w-9 h-9 rounded-full bg-[#80BF49]/15 hover:bg-[#80BF49] border border-[#80BF49]/40 text-[#80BF49] hover:text-white flex items-center justify-center transition-all shadow-sm group"
                     title="Vào trang quản trị"
                   >
                     <User className="h-4.5 w-4.5 transition-colors" />
                   </Link>
                   <button 
                     type="button"
                     onClick={() => setShowLogoutConfirm(true)}
                     className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-500 border border-red-200/70 text-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                     title="Đăng xuất"
                   >
                     <LogOut className="h-4 w-4 transition-colors" />
                   </button>
                 </div>
               ) : (
                 <div className="flex items-center gap-2">
                   <div 
                     className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-[#13426E]/5 border border-[#13426E]/10" 
                     title={`Tài khoản: ${customerName}`}
                   >
                     <div className="w-6 h-6 rounded-full bg-[#13426E]/10 flex items-center justify-center text-[#13426E]">
                       <User className="h-3.5 w-3.5" />
                     </div>
                     <span className="hidden sm:inline text-xs font-bold text-[#13426E] max-w-[100px] truncate">
                       {customerName}
                     </span>
                   </div>
                   <button 
                     type="button"
                     onClick={() => setShowLogoutConfirm(true)}
                     className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-500 border border-red-200/70 text-red-500 hover:text-white flex items-center justify-center transition-all shadow-sm cursor-pointer"
                     title="Đăng xuất"
                   >
                     <LogOut className="h-4 w-4 transition-colors" />
                   </button>
                 </div>
               )
             ) : (
               <Link 
                 href="/dang-nhap"
                 className="w-9 h-9 rounded-full bg-[#13426E]/5 hover:bg-[#80BF49]/15 border border-[#13426E]/10 hover:border-[#80BF49]/40 text-[#13426E] hover:text-[#80BF49] flex items-center justify-center transition-all shadow-sm"
                 title="Đăng nhập"
               >
                 <User className="h-4.5 w-4.5" />
               </Link>
             )}

             {/* Giỏ hàng: Chỉ render khi đã xác thực xong và người dùng KHÔNG PHẢI là Admin */}
             {mounted && !authLoading && !isAdmin && (
               <button 
                 className="p-2 text-[#13426E] hover:text-[#80BF49] transition-colors relative rounded-full hover:bg-gray-100 cursor-pointer"
                 onClick={() => setIsCartOpen(true)}
                 title="Giỏ hàng"
               >
                 <ShoppingCart className="h-5 w-5" />
                 {cartTotalItems > 0 && (
                   <span className="absolute top-0 right-0 bg-[#ff0000] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                     {cartTotalItems}
                   </span>
                 )}
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg absolute w-full left-0 h-screen z-40">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
             {siteConfig.navigation.map((item) => {
                let dropdownItems = item.items;
                if (item.title === "Sản phẩm") {
                  dropdownItems = categories.length > 0 
                    ? categories.map(c => ({ title: c.name, href: `/san-pham?category=${c.slug}` }))
                    : item.items;
                }
                
                return (
                  <div key={item.title}>
                    {item.href ? (
                      <Link href={item.href} className="text-[#13426E] font-extrabold text-lg uppercase block py-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                        {item.title}
                      </Link>
                    ) : (
                      <div className="text-[#13426E] font-extrabold text-lg uppercase py-2.5">
                        {item.title}
                      </div>
                    )}
                    {dropdownItems && (
                      <div className="pl-4 flex flex-col gap-2 mt-1">
                        {dropdownItems.map((subItem) => (
                           <Link key={subItem.title} href={subItem.href} className="text-base text-[#325B7F] font-bold block py-1.5" onClick={() => setIsMobileMenuOpen(false)}>
                             {subItem.title}
                           </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
             })}
          </nav>
        </div>
      )}

      {/* Mini Cart Drawer */}
      <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Modal xác nhận đăng xuất */}
      <ConfirmLogoutModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleConfirmLogout}
        isLoading={isLoggingOut}
      />
    </header>
  );
}
