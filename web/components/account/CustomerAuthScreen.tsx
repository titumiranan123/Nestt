"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { safeAccountReturn } from "@/lib/account/auth-navigation";
import { CustomerAuthForm, type AuthMode } from "./CustomerAuthForm";

export function CustomerAuthScreen({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = safeAccountReturn(params.get("next"));
  const requestedMethod = params.get("method");
  const initialMode = mode === "login" && requestedMethod === "email"
    ? "email-login"
    : mode === "login" && requestedMethod === "sms"
      ? "phone"
      : mode;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code") && !url.searchParams.has("email")) return;
    url.searchParams.delete("code");
    url.searchParams.delete("email");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, []);

  return (
    <CustomerAuthForm
      initialMode={initialMode}
      returnTo={returnTo}
      onAuthenticated={() => router.replace(returnTo)}
    />
  );
}
