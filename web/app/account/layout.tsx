import type { Metadata } from "next";
import { Suspense } from "react";
import { siteFont } from "@/lib/fonts";
import { AccountProvider } from "@/components/account/AccountProvider";
import { AccountShell } from "@/components/account/AccountShell";
import "@/components/account/account.css";

export const metadata: Metadata = {
  title: "Your account | Nestt",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={siteFont.className}>
      <Suspense
        fallback={
          <div className="account-loading" role="status">
            Loading your Nestt account…
          </div>
        }
      >
        <AccountProvider>
          <AccountShell>{children}</AccountShell>
        </AccountProvider>
      </Suspense>
    </div>
  );
}
