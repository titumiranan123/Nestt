"use client";

import { useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import AdminIcon from "@/components/admin/AdminIcon";
import { confirmAction } from "@/lib/alert";

export default function AdminTopbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const loggingOut = useRef(false);
  const name = session?.user?.name || session?.user?.email || "Admin user";
  const role = session?.user?.role?.replaceAll("_", " ") ?? "Admin";

  async function logout() {
    if (loggingOut.current) return;
    if (
      !(await confirmAction(
        "Sign out?",
        "You will need to sign in again to access the admin panel.",
      ))
    )
      return;
    loggingOut.current = true;
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white px-3 text-ink sm:px-5 lg:px-8">
      <button
        className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand lg:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <AdminIcon name="menu" />
      </button>
      <div className="flex h-10 w-full max-w-md items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-gray-400 focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10">
        <AdminIcon name="search" size={17} />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          aria-label="Search"
          placeholder="Search orders, customers, products..."
        />
        <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 sm:block">
          ⌘ K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 text-sm font-medium text-gray-500 md:flex">
          <AdminIcon name="calendar" size={15} />
          <span>Oct 28, 2026</span>
        </div>
        <button
          className="relative grid size-9 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand"
          aria-label="Notifications"
        >
          <AdminIcon name="bell" size={19} />
          <i className="absolute right-2 top-2 size-1.5 rounded-full border border-white bg-accent" />
        </button>
        <div className="hidden h-7 w-px bg-gray-200 sm:block" />
        <div className="relative">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-gray-100"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-xs font-bold text-brand">
              {name.slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden max-w-36 sm:block">
              <strong className="block truncate text-xs font-semibold text-gray-900">
                {name}
              </strong>
              <small className="mt-0.5 block text-[10px] text-gray-500">
                {role}
              </small>
            </span>
            <AdminIcon
              className="hidden text-gray-400 sm:inline"
              name="chev-down"
              size={14}
            />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-white p-2 text-ink shadow-xl"
            >
              <div className="border-b border-line px-3 py-2">
                <strong className="block truncate text-sm">{name}</strong>
                <small className="text-xs text-muted">{role}</small>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
