"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/lib/api/errors";
import { useResetPassword } from "@/hooks/use-password-recovery";
import { isPasswordResetCode, normalizeEmail } from "@/lib/auth/validation";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const mutation = useResetPassword();
  const [validationError, setValidationError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(form.get("email"));
    const code = form.get("code");
    const password = form.get("password");
    const confirmPassword = form.get("confirmPassword");
    if (!email) {
      setValidationError("Enter a valid email address.");
      return;
    }
    if (!isPasswordResetCode(code)) {
      setValidationError("Enter the six-digit reset code.");
      return;
    }
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
      setValidationError("Password must be between 12 and 128 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }
    setValidationError("");
    mutation.mutate({ email, code, password });
  }

  return <main className="grid min-h-svh place-items-center bg-[#f6f8fa] p-4"><section className="w-full max-w-md rounded-2xl border border-[#e6d9d5] bg-white p-7 shadow-[0_20px_70px_#49342c0b] sm:p-10"><p className="text-xs font-semibold text-accent">Account recovery</p><h1 className="mt-2 text-2xl font-bold text-ink">Reset your password</h1><p className="mt-2 text-sm text-muted">Enter the code sent to your email and choose a new password.</p><form className="mt-6 grid gap-4" onSubmit={submit} noValidate><label className="grid gap-2 text-xs font-semibold" htmlFor="email">Email address<input defaultValue={searchParams.get("email") ?? ""} className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="email" name="email" type="email" autoComplete="email" required/></label><label className="grid gap-2 text-xs font-semibold" htmlFor="code">Six-digit reset code<input className="h-11 rounded-md border border-line px-3 text-sm font-normal tracking-[.25em] outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required/></label><label className="grid gap-2 text-xs font-semibold" htmlFor="password">New password<input className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required/></label><label className="grid gap-2 text-xs font-semibold" htmlFor="confirmPassword">Confirm new password<input className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required/></label>{validationError ? <p className="text-xs text-red-700" role="alert">{validationError}</p> : null}{mutation.error ? <p className="text-xs text-red-700" role="alert">{getErrorMessage(mutation.error)}</p> : null}{mutation.data ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{mutation.data.message} <Link className="font-semibold underline" href="/login">Sign in</Link>.</p> : null}<button disabled={mutation.isPending || Boolean(mutation.data)} className="h-11 rounded-md bg-brand text-sm font-bold text-white disabled:opacity-60" type="submit">{mutation.isPending ? "Updating…" : "Update password"}</button><Link href="/login" className="text-center text-xs font-medium text-brand underline-offset-4 hover:underline">Back to sign in</Link></form></section></main>;
}
