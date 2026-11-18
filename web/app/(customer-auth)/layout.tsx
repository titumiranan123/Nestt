import type { Metadata } from "next";
import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { siteFont } from "@/lib/fonts";
import { StorefrontChrome } from "@/components/navigation/StorefrontChrome";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: { default: "Your account | Nestt", template: "%s | Nestt" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
  alternates: { canonical: null },
};

export default function CustomerAuthLayout({ children }: { children: ReactNode }) {
  return (
    <StorefrontChrome>
      <div className={`${siteFont.className} account-app customer-auth-page`}>
        <div className="customer-auth-main">
          <div className="customer-auth-cover">
            <Image src="/assets/figma-home/room-living.png" alt="" fill sizes="(min-width: 900px) 48vw, 1px" />
          </div>
          <div className="customer-auth-panel">
            <Suspense fallback={<div className="account-auth" role="status">Loading your account…</div>}>
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </StorefrontChrome>
  );
}
