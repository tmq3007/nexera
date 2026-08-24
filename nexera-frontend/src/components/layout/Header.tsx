"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Menu, ChevronDown, ShoppingCart } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useState } from "react";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* Main Header */}
      <div className="container mx-auto px-4">
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
             {/* Note: In a real scenario, use actual logo. The user provided: D:\Document\_Projects\Nexera\nexera-frontend\public\logo.png */}
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
            {siteConfig.navigation.map((item) => (
              <div key={item.title} className="relative group">
                {item.href ? (
                  <Link 
                    href={item.href} 
                    className="text-[#13426E] font-bold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1"
                  >
                    {item.title}
                    {item.items && <ChevronDown className="h-4 w-4" />}
                  </Link>
                ) : (
                  <button className="text-[#13426E] font-bold uppercase hover:text-[#80BF49] transition-colors py-8 flex items-center gap-1">
                    {item.title}
                    {item.items && <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
                
                {/* Dropdown Menu */}
                {item.items && (
                  <div className="absolute top-full left-0 hidden group-hover:block w-64 bg-white shadow-lg border-t-2 border-[#13426E]">
                    <ul className="py-2">
                      {item.items.map((subItem) => (
                        <li key={subItem.title}>
                          <Link 
                            href={subItem.href} 
                            className="block px-4 py-3 text-sm text-[#13426E] uppercase font-light hover:bg-[#F0F7FB] hover:text-[#80BF49] transition-colors"
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
             {/* Removed Social Icons */}
             <button className="text-[#13426E] hover:text-[#80BF49] transition-colors">
               <Search className="h-5 w-5" />
             </button>
             <button className="text-[#13426E] hover:text-[#80BF49] transition-colors relative">
               <ShoppingCart className="h-5 w-5" />
               <span className="absolute -top-2 -right-2 bg-[#ff0000] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                 0
               </span>
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
             {siteConfig.navigation.map((item) => (
                <div key={item.title}>
                  {item.href ? (
                    <Link href={item.href} className="text-[#13426E] font-bold uppercase block py-2">
                      {item.title}
                    </Link>
                  ) : (
                    <div className="text-[#13426E] font-bold uppercase py-2">
                      {item.title}
                    </div>
                  )}
                  {item.items && (
                    <div className="pl-4 flex flex-col gap-2 mt-2">
                      {item.items.map((subItem) => (
                         <Link key={subItem.title} href={subItem.href} className="text-sm text-[#325B7F] block py-1">
                           {subItem.title}
                         </Link>
                      ))}
                    </div>
                  )}
                </div>
             ))}
          </nav>
        </div>
      )}
    </header>
  );
}
