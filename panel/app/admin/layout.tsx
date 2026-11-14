import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/rbac/roles";

export const metadata: Metadata = {
  title: { default: "Dashboard | Nestt Admin", template: "%s | Nestt Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-canvas font-sans text-sm text-gray-500">
          Loading your workspace…
        </div>
      }
    >
      <AdminSessionGate>{children}</AdminSessionGate>
    </Suspense>
  );
}

async function AdminSessionGate({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();
  if (session?.error === "RefreshTokenError")
    redirect("/login?error=SessionExpired");
  if (!session?.user?.id || !isStaffRole(session.user.role)) {
    const callbackUrl = "/admin";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return (
    <AdminProviders session={session}>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
