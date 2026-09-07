"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, ChevronDown, ShoppingCart, User, Settings, LogOut, Package } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { MiniCart } from "@/components/storefront/MiniCart";

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
  const cartTotalItems = useCartStore((state) => state.totalItems());
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    async function fetchData() {
      try {
        // Lấy danh mục sản phẩm
        const { data: catData } = await supabase.from("categories").select("name, slug");
        if (catData) setCategories(catData);

        // Kiểm tra phiên đăng nhập
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsAuth(true);
          const [adminRes, customerRes] = await Promise.all([
            supabase.from("admin_accounts").select("id, display_name").eq("auth_user_id", user.id).maybeSingle(),
            supabase.from("customers").select("id, full_name").eq("auth_user_id", user.id).maybeSingle()
          ]);
          
          if (adminRes.data) {
            setIsAdmin(true);
          } else {
            // Mọi tài khoản không phải Admin đăng nhập ở Storefront đều là Customer
            setIsCustomer(true);
            const name = customerRes.data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Khách hàng";
            setCustomerName(name);

            // Tự động đảm bảo tạo hồ sơ customer nếu chưa có trong DB
            if (!customerRes.data) {
              await supabase.from("customers").insert({
                auth_user_id: user.id,
                email: user.email,
                full_name: name,
              });
            }
          }
        }
      } finally {
        setAuthLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsCustomer(false);
    setIsAuth(false);
    window.location.href = "/";
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
               src="/logo.png" 
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
          <div className="flex items-center gap-3">
             {mounted && !authLoading && (
               isAuth ? (
                 <div className="relative group">
                   <button 
                     className="text-[#13426E] hover:text-[#80BF49] transition-colors flex items-center gap-2.5 py-7 group"
                     title="Tài khoản"
                   >
                     <div className="w-9 h-9 rounded-full bg-[#13426E]/5 group-hover:bg-[#80BF49]/15 border border-[#13426E]/10 group-hover:border-[#80BF49]/40 flex items-center justify-center transition-all shadow-sm">
                       <User className="h-4.5 w-4.5 text-[#13426E] group-hover:text-[#80BF49] transition-colors" />
                     </div>
                     {!isAdmin && (
                       <span className="hidden lg:block text-sm font-bold truncate max-w-[120px] text-[#13426E]">{customerName}</span>
                     )}
                   </button>
                   
                   {/* Dropdown User Menu */}
                   <div className="absolute top-full right-0 hidden group-hover:block w-52 pt-2 z-50 transition-all duration-200">
                     <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100/80">
                       
                       {/* Action Links */}
                       <div className="p-2 space-y-1">
                         {isAdmin ? (
                           <Link 
                             href="/admin" 
                             className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#13426E] hover:bg-[#F0F7FB] hover:text-[#80BF49] transition-all group/item"
                           >
                             <div className="p-2 rounded-lg bg-[#80BF49]/10 text-[#80BF49] group-hover/item:bg-[#80BF49] group-hover/item:text-white transition-colors">
                               <Settings className="w-4 h-4" />
                             </div>
                             <span>Quản trị</span>
                           </Link>
                         ) : (
                           <>
                             <Link 
                               href="/tai-khoan" 
                               className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#13426E] hover:bg-[#F0F7FB] hover:text-[#80BF49] transition-all group/item"
                             >
                               <div className="p-2 rounded-lg bg-[#13426E]/5 text-[#13426E] group-hover/item:bg-[#80BF49] group-hover/item:text-white transition-colors">
                                 <User className="w-4 h-4" />
                               </div>
                               <span>Tài khoản của tôi</span>
                             </Link>
                             <Link 
                               href="/tai-khoan/don-hang" 
                               className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#13426E] hover:bg-[#F0F7FB] hover:text-[#80BF49] transition-all group/item"
                             >
                               <div className="p-2 rounded-lg bg-[#13426E]/5 text-[#13426E] group-hover/item:bg-[#80BF49] group-hover/item:text-white transition-colors">
                                 <Package className="w-4 h-4" />
                               </div>
                               <span>Đơn hàng đã mua</span>
                             </Link>
                           </>
                         )}
                       </div>

                       {/* Logout Button */}
                       <div className="p-2">
                         <button 
                           onClick={handleLogout} 
                           className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all text-left group/logout"
                         >
                           <div className="p-2 rounded-lg bg-red-50 text-red-500 group-hover/logout:bg-red-500 group-hover/logout:text-white transition-colors">
                             <LogOut className="w-4 h-4" />
                           </div>
                           <span>Đăng xuất</span>
                         </button>
                       </div>

                     </div>
                   </div>
                 </div>
               ) : (
                 <Link 
                   href="/dang-nhap"
                   className="p-2 text-[#13426E] hover:text-[#80BF49] transition-colors rounded-full hover:bg-gray-100"
                   title="Đăng nhập"
                 >
                   <User className="h-5 w-5" />
                 </Link>
               )
             )}

             {!isAdmin && (
               <button 
                 className="p-2 text-[#13426E] hover:text-[#80BF49] transition-colors relative rounded-full hover:bg-gray-100"
                 onClick={() => setIsCartOpen(true)}
                 title="Giỏ hàng"
               >
                 <ShoppingCart className="h-5 w-5" />
                 {mounted && cartTotalItems > 0 && (
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
    </header>
  );
}
