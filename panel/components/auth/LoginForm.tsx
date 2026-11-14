"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { normalizeEmail, readLoginCredentials } from "@/lib/auth/validation";
const authErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "Email or password is incorrect.",
  NOT_ADMIN: "This account is not allowed to access the admin panel.",
  RATE_LIMITED: "Too many attempts. Try again later.",
  SERVER_UNAVAILABLE: "Service unavailable. Please try again.",
};

function safeCallbackUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/admin";
  try {
    const candidate = new URL(value, window.location.origin);
    if (candidate.origin !== window.location.origin) return "/admin";
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return "/admin";
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const submitting = useRef(false);
  const expiryHandled = useRef(false);

  useEffect(() => {
    if (searchParams.get("error") !== "SessionExpired") return;
    setError("Your session expired. Sign in again.");
    if (searchParams.get("signedOut") === "1" || expiryHandled.current) return;
    expiryHandled.current = true;
    void signOut({ redirect: false }).then(() => router.replace("/login?error=SessionExpired&signedOut=1"));
  }, [router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setEmailError("");
    setPasswordError("");
    const form = new FormData(event.currentTarget);
    const emailValue = form.get("email");
    const passwordValue = form.get("password");
    const credentials = readLoginCredentials(emailValue, passwordValue);
    if (!credentials) {
      if (!normalizeEmail(emailValue)) {
        setEmailError("Enter a valid email address.");
      }
      if (typeof passwordValue !== "string" || passwordValue.length === 0) {
        setPasswordError("Enter your password.");
      }
      return;
    }
    submitting.current = true;
    setIsPending(true);
    try {
      const destination = safeCallbackUrl(searchParams.get("callbackUrl"));
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        redirectTo: destination,
      });
      if (result?.error) {
        setError(authErrorMessages[result.code ?? ""] ?? "Sign-in failed. Please try again.");
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Service unavailable. Please try again.");
    } finally {
      submitting.current = false;
      setIsPending(false);
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#f6f8fa] p-4 sm:p-8">
      <div className="grid min-h-[505px] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-[#e6d9d5] bg-white shadow-[0_20px_70px_#49342c0b] md:grid-cols-2">
        <section className="flex min-h-[280px] flex-col bg-[linear-gradient(135deg,#09547b_0%,#054468_62%,#073958_100%)] p-6 text-white sm:p-11 md:min-h-0" aria-label="Nestt panel">
          <div className="grid size-11 place-items-center rounded-xl bg-white/15" aria-hidden="true"><BadgeCheck className="size-6" strokeWidth={1.8} /></div>
          <div className="flex flex-1 items-center py-7"><div className="flex min-h-[103px] w-full flex-col justify-center rounded-lg bg-white px-6 py-4"><Image src="/assets/brand/nestt-logo.png" alt="Nestt" width={136} height={36} preload className="h-9 w-[136px] object-cover" /><div className="mt-2 text-[10px] tracking-[.01em] text-[#53606a]">Thoughtful spaces, made together</div></div></div>
          <div className="grid gap-2.5"><div className="flex min-h-12 items-center rounded-lg border border-white/40 bg-white/10 px-4 text-[13px] font-semibold">Role based dashboard access</div><div className="flex min-h-12 items-center rounded-lg border border-white/40 bg-white/10 px-4 text-[13px] font-semibold">Protected admin workflow</div></div>
        </section>
        <section className="flex items-center justify-center px-6 py-10 sm:px-12" aria-labelledby="login-title">
          <div className="w-full max-w-md">
            <div className="mb-2.5 text-xs font-semibold text-[#f15a22]">Dashboard access</div>
            <h1 id="login-title" className="mb-4 text-2xl font-bold leading-tight tracking-[-.035em] text-[#20262a]">Sign in to admin</h1>
            <p className="mb-6 text-xs leading-relaxed text-gray-500">Use your Nestt admin account to continue.</p>
            <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-2"><label className="text-xs font-semibold text-[#152d3a]" htmlFor="email">Email address</label><div className="flex h-11 w-full items-center rounded-md border border-gray-300 bg-white text-[#8a9bac] transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"><Mail className="ml-3.5 size-[18px] shrink-0" strokeWidth={1.7} aria-hidden="true" /><input aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-error" : undefined} className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-gray-800 outline-none placeholder:text-[#9aaabd]" id="email" name="email" type="email" autoComplete="username" placeholder="admin@nestt.com" required /></div>{emailError ? <p id="email-error" className="text-xs text-red-700">{emailError}</p> : null}</div>
              <div className="grid gap-2"><label className="text-xs font-semibold text-[#152d3a]" htmlFor="password">Password</label><div className="flex h-11 w-full items-center rounded-md border border-gray-300 bg-white text-[#8a9bac] transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"><LockKeyhole className="ml-3.5 size-[18px] shrink-0" strokeWidth={1.7} aria-hidden="true" /><input aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? "password-error" : undefined} className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] text-gray-800 outline-none placeholder:text-[#9aaabd]" id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter password" required /><button type="button" className="grid h-full w-10 place-items-center text-gray-400 hover:text-gray-700" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="size-[19px]" strokeWidth={1.7} /> : <Eye className="size-[19px]" strokeWidth={1.7} />}</button></div>{passwordError ? <p id="password-error" className="text-xs text-red-700">{passwordError}</p> : null}</div>
              {error ? <p className="-mb-2 text-xs text-red-700" role="alert">{error}</p> : null}
              <button type="submit" disabled={isPending} className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-bold text-white shadow-md shadow-brand/15 transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60">{isPending ? <><LoaderCircle size={17} className="animate-spin"/>Signing in…</> : "Sign in"}</button>
              <Link href="/forgot-password" className="text-center text-xs font-medium text-brand underline-offset-4 hover:underline">Forgot your password?</Link>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
