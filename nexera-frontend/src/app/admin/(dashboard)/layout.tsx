"use client";

import { useState, Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
          <AdminHeader onMenuToggle={() => setMobileMenuOpen(true)} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          <Suspense fallback={null}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
