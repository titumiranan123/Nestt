"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getErrorMessage } from "@/lib/api/errors";
import { useForgotPassword } from "@/hooks/use-password-recovery";
import { normalizeEmail } from "@/lib/auth/validation";

export function ForgotPasswordForm() {
  const mutation = useForgotPassword();
  const [emailError, setEmailError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = normalizeEmail(form.get("email"));
    if (!email) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setSubmittedEmail(email);
    mutation.mutate({ email });
  }

  return <main className="grid min-h-svh place-items-center bg-[#f6f8fa] p-4"><section className="w-full max-w-md rounded-2xl border border-[#e6d9d5] bg-white p-7 shadow-[0_20px_70px_#49342c0b] sm:p-10"><p className="text-xs font-semibold text-accent">Account recovery</p><h1 className="mt-2 text-2xl font-bold text-ink">Forgot password?</h1><p className="mt-2 text-sm text-muted">Enter the email address on your account. If eligible, we’ll send a reset code.</p><form className="mt-6 grid gap-4" onSubmit={submit} noValidate><label className="grid gap-2 text-xs font-semibold" htmlFor="email">Email address<input className="h-11 rounded-md border border-line px-3 text-sm font-normal outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(emailError)}/></label>{emailError ? <p className="text-xs text-red-700">{emailError}</p> : null}{mutation.error ? <p className="text-xs text-red-700" role="alert">{getErrorMessage(mutation.error)}</p> : null}{mutation.data ? <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{mutation.data.message} If you received a code, <Link className="font-semibold underline" href={`/reset-password?email=${encodeURIComponent(submittedEmail)}`}>reset your password</Link>.</div> : null}<button disabled={mutation.isPending} className="h-11 rounded-md bg-brand text-sm font-bold text-white disabled:opacity-60" type="submit">{mutation.isPending ? "Sending…" : "Send reset code"}</button><Link href="/login" className="text-center text-xs font-medium text-brand underline-offset-4 hover:underline">Back to sign in</Link></form></section></main>;
}
