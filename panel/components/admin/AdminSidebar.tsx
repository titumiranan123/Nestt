"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  filterMenuByPermissions,
  sidebarMenu,
  type AdminNavItem,
} from "@/lib/admin-navigation";
import AdminIcon from "@/components/admin/AdminIcon";

const navItemState = (active: boolean) =>
  active
    ? "border-l-2 border-accent bg-brand-soft text-brand"
    : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-brand";

export default function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const permissions = session?.user?.permissions ?? [];
  const role = session?.user?.role;
  const menuItems = filterMenuByPermissions(sidebarMenu, permissions);

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-40 bg-gray-950/40 lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col overflow-hidden border-r border-line bg-white px-4 pb-5 pt-3.5 text-ink transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : ""}`}
      >
        <Link
          href="/admin"
          className="mb-10 flex  w-full shrink-0 items-center justify-center no-underline"
          aria-label="Nestt admin home"
          onClick={onClose}
        >
          <Image
            src="/assets/brand/nestt-logo.png"
            alt="Nestt"
            width={136}
            height={36}
            className="h-9 w-[136px] object-cover"
          />
        </Link>
        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-1 [scrollbar-color:rgba(107,114,128,0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb:hover]:bg-gray-400"
          aria-label="Admin navigation"
        >
          {menuItems.map((item, index) => {
            if (item.section)
              return (
                <div
                  key={`section-${index}`}
                  className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-gray-400 first:pt-0"
                >
                  {item.section}
                </div>
              );
            if (!item.title) return null;
            const active = item.href
              ? item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href)
              : false;
            if (!item.children?.length && item.href) {
              const isReady = [
                "/admin",
                "/admin/orders",
                "/admin/products",
                "/admin/categories",
                "/admin/products/attributes",
                "/admin/brands",
                "/admin/coupons",
                "/admin/notifications",
                "/admin/seo",
              ].includes(item.href);
              if (item.href === "/")
                return (
                  <button
                    key={item.title}
                    type="button"
                    className={`mt-1 flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${navItemState(active)}`}
                    onClick={() => router.push("/")}
                  >
                    <AdminIcon name={item.icon ?? "logout"} />
                    <span>{item.title}</span>
                  </button>
                );
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={(event) => {
                    if (!isReady) event.preventDefault();
                    onClose();
                  }}
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold no-underline transition ${navItemState(active)} ${!isReady ? "cursor-default" : ""}`}
                  aria-disabled={!isReady}
                >
                  <AdminIcon name={item.icon ?? "grid"} />
                  <span className="min-w-0 flex-1">{item.title}</span>
                  {!isReady && (
                    <span className="ml-auto text-[10px] font-normal text-gray-400">
                      Soon
                    </span>
                  )}
                </Link>
              );
            }
            const children = item.children ?? [];
            const hasActiveChild = children.some(
              (child) => child.href && pathname.startsWith(child.href),
            );
            const expanded = openGroups[item.title] ?? hasActiveChild;
            return (
              <div className="grid gap-0.5" key={item.title}>
                <button
                  type="button"
                  className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${navItemState(hasActiveChild)}`}
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [item.title!]: !expanded,
                    }))
                  }
                >
                  <AdminIcon name={item.icon ?? "grid"} />
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <AdminIcon name="chev-down" size={14} />
                </button>
                {expanded && (
                  <div className="ml-5 mb-1 grid gap-0.5 border-l border-dashed border-gray-200 py-1 pl-3">
                    {children.map((child: AdminNavItem) => {
                      if (!child.href) return null;
                      const childActive =
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`);
                      const isReady = [
                        "/admin/orders",
                        "/admin/products",
                        "/admin/categories",
                        "/admin/products/attributes",
                        "/admin/brands",
                        "/admin/customers",
                        "/admin/access/roles",
                        "/admin/staff",
                        "/admin/audit-logs",
                        "/admin/backups",
                        "/admin/coupons",
                        "/admin/notifications",
                        "/admin/seo",
                        "/admin/seo/page-seo",
                        "/admin/seo/robots",
                        "/admin/seo/sitemap",
                        "/admin/settings/general",
                        "/admin/settings/shipping",
                        "/admin/location",
                        "/admin/settings/payments",
                        "/admin/inventory",
                        "/admin/inventory/adjustments",
                        "/admin/inventory/low-stock",
                        "/admin/bulk-image-upload",
                        "/admin/video-upload",
                      ].includes(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-disabled={!isReady}
                          onClick={(event) => {
                            if (!isReady) event.preventDefault();
                            onClose();
                          }}
                          className={`relative flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition ${navItemState(childActive)} ${!isReady ? "cursor-default" : ""}`}
                        >
                          {child.icon && (
                            <AdminIcon name={child.icon} size={13} />
                          )}
                          <span className="min-w-0 flex-1">{child.title}</span>
                          {!isReady && (
                            <span className="ml-auto text-[9px] font-normal text-gray-400">
                              Soon
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="mt-3 flex shrink-0 items-center gap-2.5 rounded-lg border border-line bg-gray-50 px-2.5 py-3">
          <span className="size-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
          <div>
            <strong className="block text-[11px] font-semibold text-gray-800">
              All systems normal
            </strong>
            <small className="mt-0.5 block text-[10px] text-gray-500">
              Demo workspace · data is local
            </small>
          </div>
        </div>
        <div className="mt-3 flex shrink-0 items-center gap-2.5 border-t border-line pt-3">
          <div className="grid size-9 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
            {(session?.user?.name || session?.user?.email || "AD")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-semibold text-gray-900">
              {session?.user?.name || session?.user?.email || "Admin user"}
            </strong>
            <small className="mt-0.5 block text-[10px] text-gray-500">
              {role?.replaceAll("_", " ") ?? "Admin"}
            </small>
          </div>
          <button
            className="rounded-md px-2 py-1 text-gray-400 transition hover:bg-gray-100 hover:text-brand"
            aria-label="Account options"
          >
            <AdminIcon name="more" size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
