"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/dang-nhap") || 
    pathname.startsWith("/dang-ky");

  // Auth routes (/dang-nhap, /dang-ky) & Admin routes không sử dụng Header/Footer của Storefront
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingContact />
    </>
  );
}
