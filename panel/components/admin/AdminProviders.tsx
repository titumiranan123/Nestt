"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { QueryProvider } from "@/lib/query/QueryProvider";

function SessionErrorHandler() {
  const { data } = useSession();
  const signingOut = useRef(false);
  useEffect(() => {
    if (data?.error !== "RefreshTokenError" || signingOut.current) return;
    signingOut.current = true;
    void signOut({ redirectTo: "/login?error=SessionExpired&signedOut=1" });
  }, [data?.error]);
  return null;
}

export function AdminProviders({
  children,
  session,
}: {
  children: ReactNode;
  session: Session;
}) {
  return (
    <SessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <SessionErrorHandler />
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
