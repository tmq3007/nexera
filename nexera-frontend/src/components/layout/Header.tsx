"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Menu, ChevronDown, ShoppingCart, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<{name: string, slug: string}[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from("categories").select("name, slug");
      if (data) setCategories(data);
    }
    fetchCategories();
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // For now we just route to products page. In real app, might pass query param
      router.push(`/san-pham`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Main Header */}
      <div className="container mx-auto px-4 relative">
        <div className="flex h-[70px] md:h-[100px] items-center justify-between">
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
               className="h-[50px] md:h-[76px] w-auto object-contain" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-1 justify-end items-center gap-6 xl:gap-8 mr-6">
            {siteConfig.navigation.map((item) => {
              // Replace static product categories with dynamic ones
              let dropdownItems = item.items;
              if (item.title === "Sản phẩm") {
                dropdownItems = categories.length > 0 
                  ? categories.map(c => ({ title: c.name, href: `/san-pham?category=${c.slug}` }))
                  : item.items;
              }

              return (
                <div key={item.title} className="relative group">
                  {item.href ? (
                    <Link 
                      href={item.href} 
                      className="text-[#13426E] font-bold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1"
                    >
                      {item.title}
                      {dropdownItems && <ChevronDown className="h-4 w-4" />}
                    </Link>
                  ) : (
                    <button className="text-[#13426E] font-bold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1">
                      {item.title}
                      {dropdownItems && <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                  
                  {/* Dropdown Menu */}
                  {dropdownItems && (
                    <div className="absolute top-full left-0 hidden group-hover:block w-64 bg-white shadow-lg border-t-2 border-[#13426E]">
                      <ul className="py-2">
                        {dropdownItems.map((subItem) => (
                          <li key={subItem.title}>
                            <Link 
                              href={subItem.href} 
                              className="block px-4 py-3 text-sm text-[#13426E] uppercase font-bold hover:bg-[#F0F7FB] hover:text-[#80BF49] transition-colors"
                            >
                              {subItem.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
             <button 
               className="text-[#13426E] hover:text-[#80BF49] transition-colors"
               onClick={() => setIsSearchOpen(!isSearchOpen)}
             >
               {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
             </button>
             <button className="text-[#13426E] hover:text-[#80BF49] transition-colors relative">
               <ShoppingCart className="h-5 w-5" />
               <span className="absolute -top-2 -right-2 bg-[#ff0000] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                 0
               </span>
             </button>
          </div>
        </div>

        {/* Search Bar Overlay */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-t p-4 shadow-lg animate-in slide-in-from-top-2">
            <form onSubmit={handleSearch} className="flex max-w-2xl mx-auto gap-2">
              <input 
                type="text" 
                placeholder="Tìm kiếm sản phẩm, bài viết..." 
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-[#80BF49]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="bg-[#13426E] text-white px-6 py-2 rounded-lg hover:bg-[#80BF49] transition-colors font-bold">
                Tìm
              </button>
            </form>
          </div>
        )}
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
                      <Link href={item.href} className="text-[#13426E] font-bold uppercase block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                        {item.title}
                      </Link>
                    ) : (
                      <div className="text-[#13426E] font-bold uppercase py-2">
                        {item.title}
                      </div>
                    )}
                    {dropdownItems && (
                      <div className="pl-4 flex flex-col gap-2 mt-2">
                        {dropdownItems.map((subItem) => (
                           <Link key={subItem.title} href={subItem.href} className="text-sm text-[#325B7F] font-bold block py-1" onClick={() => setIsMobileMenuOpen(false)}>
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
    </header>
  );
}
