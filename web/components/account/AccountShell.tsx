"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NesttFurnitureHomePageFooter } from "@/components/home-page/NesttFurnitureHomePageFooter";
import { useCart } from "@/components/cart/CartProvider";
import { useAccount } from "./AccountProvider";
import { Icon, Modal } from "./ui";
import { authHref } from "@/lib/account/auth-navigation";

const links = [
  { href: "/account", label: "Overview", icon: "home" },
  { href: "/account/orders", label: "My Orders", icon: "box" },
  { href: "/account/wishlist", label: "Wishlist", icon: "heart" },
  { href: "/account/addresses", label: "My Addresses", icon: "pin" },
  { href: "/account/profile", label: "Profile & Security", icon: "lock" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const router = useRouter();
  const { state, session, loadError, reload, busy, toast, dismissToast, signOut } = useAccount();
  const { openCart } = useCart();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const openBagFromLink = params.get("bag") === "1";
  useEffect(() => {
    if (openBagFromLink) openCart();
  }, [openBagFromLink, openCart]);

  useEffect(() => {
    if (session === "signed-out") {
      router.replace(authHref("/login", path + (query ? `?${query}` : "")));
    }
  }, [session, router, path, query]);

  const active = links.find((link) => link.href === "/account" ? path === link.href : path.startsWith(link.href));
  const initials = state.profile.name.split(" ").filter(Boolean).map((name) => name[0]).slice(0, 2).join("");

  return (
    <div className="account-app">
      <a className="account-skip" href="#account-content">Skip to account content</a>
      <div className="account-container">
        <nav className="account-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          {active && active.href !== "/account" && session === "signed-in" ? (
            <><Link href="/account">My account</Link><span>/</span><span aria-current="page">{active.label}</span></>
          ) : <span aria-current="page">My account</span>}
        </nav>

        {session === "loading" ? (
          <main id="account-content" className="account-loading" role="status" aria-label="Loading your account">
            <div className="skeleton skeleton-title" />
            <div className="skeleton-grid">
              {[1, 2, 3].map((index) => <div className="skeleton" key={index} />)}
            </div>
          </main>
        ) : session === "signed-out" ? (
          <main id="account-content" className="account-loading" role="status">
            <div className="skeleton skeleton-title" />
            <p>Taking you to sign in…</p>
          </main>
        ) : session === "error" ? (
          <main id="account-content" className="signed-out">
            <Icon name="help" size={36} />
            <h1>We couldn’t load your account.</h1>
            <p role="alert">{loadError}</p>
            <button className="account-button primary" onClick={() => void reload()}>Try again</button>
            <button className="text-link" disabled={busy} onClick={() => void signOut()}>Sign out</button>
          </main>
        ) : (
          <div className="account-layout">
            <aside className="account-sidebar">
              <div className="account-identity">
                <span className="account-avatar">{initials}</span>
                <div><h2>{state.profile.name}</h2><p>{state.profile.phone || state.profile.email}</p></div>
              </div>
              <nav aria-label="Account navigation">
                {links.map((link) => (
                  <Link key={link.href} href={link.href}
                    className={active?.href === link.href ? "active" : ""}
                    aria-current={active?.href === link.href ? "page" : undefined}>
                    <Icon name={link.icon} /><span>{link.label}</span>
                    {link.icon === "heart" && <small>{state.wishlist.length}</small>}
                  </Link>
                ))}
              </nav>
              <div className="account-sidebar-bottom">
                <div className="sidebar-help">
                  <Icon name="help" />
                  <div><strong>Need a hand?</strong><a href="mailto:hello@nestt.com">Contact Nestt</a></div>
                </div>
                <button disabled={busy} onClick={() => setConfirmSignOut(true)}><Icon name="logout" /> Sign out</button>
              </div>
            </aside>
            <main id="account-content" className="account-content" tabIndex={-1}>
              {loadError && (
                <p className="account-alert" role="alert">
                  {loadError} <button className="text-link" onClick={() => void reload()}>Reload</button>
                </p>
              )}
              {children}
            </main>
          </div>
        )}

      </div>
      <NesttFurnitureHomePageFooter />
      {toast && (
        <div className="account-toast" role={toast.error ? "alert" : "status"}>
          <span className="toast-check"><Icon name={toast.error ? "help" : "check"} size={16} /></span>
          <span>{toast.message}</span>
          <button aria-label="Dismiss notification" onClick={dismissToast}><Icon name="close" size={16} /></button>
        </div>
      )}
      {confirmSignOut && session === "signed-in" && (
        <Modal title="Sign out of your account?" onClose={() => setConfirmSignOut(false)}>
          <p className="dialog-description">You can sign back in to see your orders and saved items.</p>
          <div className="dialog-actions">
            <button className="account-button" onClick={() => setConfirmSignOut(false)}>Stay here</button>
            <button className="account-button primary" disabled={busy} onClick={async () => {
              if (await signOut()) setConfirmSignOut(false);
            }}>Sign out</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
