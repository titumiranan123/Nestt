"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { useAccount } from "./AccountProvider";
import { Icon, Modal, EmptyState } from "./ui";
import { money, products } from "@/lib/account/data";

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
  const {
    state,
    ready,
    storageError,
    toast,
    dismissToast,
    bagOpen,
    setBagOpen,
    signOut,
    resume,
  } = useAccount();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const openBagFromLink = params.get("bag") === "1";
  useEffect(() => {
    if (ready && openBagFromLink) setBagOpen(true);
  }, [ready, openBagFromLink, setBagOpen]);
  const active = links.find((l) =>
    l.href === "/account" ? path === l.href : path.startsWith(l.href),
  );
  return (
    <div className="account-app">
      <a className="account-skip" href="#account-content">
        Skip to account content
      </a>
      <Navbar onBagClick={() => setBagOpen(true)} />
      <div className="account-preview">
        <span className="preview-dot" /> Demo account{" "}
        <span className="preview-divider">·</span> Changes stay in this browser.
        No real orders or payments.
      </div>
      <div className="account-container">
        <nav className="account-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/account">My account</Link>
          {active && (
            <>
              <span>/</span>
              <span aria-current="page">{active.label}</span>
            </>
          )}
        </nav>
        {!ready ? (
          <div
            className="account-loading"
            role="status"
            aria-label="Loading your account"
          >
            <div className="skeleton skeleton-title" />
            <div className="skeleton-grid">
              {[1, 2, 3].map((i) => (
                <div className="skeleton" key={i} />
              ))}
            </div>
          </div>
        ) : state.signedOut ? (
          <main id="account-content" className="signed-out">
            <Icon name="logout" size={36} />
            <h1>You’ve left the demo account.</h1>
            <p>Your preview changes are still saved on this device.</p>
            <button className="account-button primary" onClick={resume}>
              Open demo account <Icon name="arrow" size={16} />
            </button>
            <Link href="/">Back to Nestt</Link>
          </main>
        ) : (
          <div className="account-layout">
            <aside className="account-sidebar">
              <div className="account-identity">
                <span className="account-avatar">
                  {state.profile.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <h2>{state.profile.name}</h2>
                  <p>{state.profile.email}</p>
                </div>
              </div>
              <nav aria-label="Account navigation">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={active?.href === l.href ? "active" : ""}
                    aria-current={active?.href === l.href ? "page" : undefined}
                  >
                    <Icon name={l.icon} />
                    <span>{l.label}</span>
                    {l.icon === "heart" && (
                      <small>{state.wishlist.length}</small>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="account-sidebar-bottom">
                <div className="sidebar-help">
                  <Icon name="help" />
                  <div>
                    <strong>Need a hand?</strong>
                    <a href="mailto:hello@nestt.home">Contact Nestt</a>
                  </div>
                </div>
                <button onClick={() => setConfirmSignOut(true)}>
                  <Icon name="logout" /> Sign out
                </button>
              </div>
            </aside>
            <main
              id="account-content"
              className="account-content"
              tabIndex={-1}
            >
              {storageError && (
                <p className="account-alert" role="alert">
                  Browser storage is unavailable or was reset. Changes may not
                  survive a refresh.
                </p>
              )}
              {children}
            </main>
          </div>
        )}
        <footer className="account-footer">
          <Link href="/">
            nestt<span>.</span>
          </Link>
          <p>Furniture with feeling, made for everyday life.</p>
          <small>© {new Date().getFullYear()} Nestt Home</small>
        </footer>
      </div>
      {toast && (
        <div className="account-toast" role="status">
          <span className="toast-check">
            <Icon name="check" size={16} />
          </span>
          <span>{toast.message}</span>
          {toast.undo && <button onClick={toast.undo}>Undo</button>}
          <button aria-label="Dismiss notification" onClick={dismissToast}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {bagOpen && !state.signedOut && (
        <BagDrawer onClose={() => setBagOpen(false)} />
      )}
      {confirmSignOut && (
        <Modal
          title="Leave the demo account?"
          onClose={() => setConfirmSignOut(false)}
        >
          <p className="dialog-description">
            Your changes will remain on this device. This preview does not use a
            live login session.
          </p>
          <div className="dialog-actions">
            <button
              className="account-button"
              onClick={() => setConfirmSignOut(false)}
            >
              Stay here
            </button>
            <button
              className="account-button primary"
              onClick={() => {
                signOut();
                setConfirmSignOut(false);
              }}
            >
              Sign out
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BagDrawer({ onClose }: { onClose: () => void }) {
  const { state, updateBag } = useAccount();
  const total = state.bag.reduce(
    (sum, item) =>
      sum +
      (products.find((p) => p.id === item.productId)?.price ?? 0) *
        item.quantity,
    0,
  );
  return (
    <Modal
      title={`Your bag (${state.bag.reduce((n, i) => n + i.quantity, 0)})`}
      drawer
      onClose={onClose}
    >
      {state.bag.length === 0 ? (
        <EmptyState
          icon="bag"
          title="A little room for something lovely."
          description="Add a favourite to start your collection."
          action={
            <button className="account-button primary" onClick={onClose}>
              Continue exploring
            </button>
          }
        />
      ) : (
        <>
          <p className="dialog-description">
            Demo bag · Items are saved on this device.
          </p>
          <div className="bag-items">
            {state.bag.map((item, index) => {
              const p = products.find((p) => p.id === item.productId);
              if (!p) return null;
              return (
                <div
                  className="bag-item"
                  key={`${item.productId}-${item.option}`}
                >
                  <Image src={p.image} width={110} height={100} alt={p.name} />
                  <div>
                    <h3>{p.name}</h3>
                    <p>{item.option}</p>
                    <strong>{money(p.price * item.quantity)}</strong>
                    <div className="bag-quantity">
                      <button
                        aria-label={`Decrease ${p.name} quantity`}
                        onClick={() => updateBag(index, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        aria-label={`Increase ${p.name} quantity`}
                        onClick={() => updateBag(index, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="text-link"
                        onClick={() => updateBag(index, 0)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bag-summary">
            <span>Subtotal</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="account-note">
            Delivery charges are calculated at checkout. Checkout and payments
            are not available in this demo.
          </p>
          <button
            className="account-button primary full-width"
            onClick={onClose}
          >
            Continue shopping
          </button>
        </>
      )}
    </Modal>
  );
}
