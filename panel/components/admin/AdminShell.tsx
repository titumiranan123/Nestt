"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import AdminIcon from "@/components/admin/AdminIcon";

export const Icon = AdminIcon;

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="admin-shell flex min-h-screen bg-white font-sans text-ink">
      <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="ml-0 flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
        <AdminTopbar onOpenSidebar={() => setMobileOpen(true)} />
        <div
          aria-hidden="true"
          className="pointer-events-none bg-brand fixed inset-x-0 top-16 z-[60] h-[2px] bg-"
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">
          {children}
        </main>
        <footer className="flex justify-between gap-3 px-3 pb-4 text-[11px] text-gray-400 sm:px-5 lg:px-8">
          <span>© 2026 Nestt Admin</span>
        </footer>
      </div>
    </div>
  );
}
