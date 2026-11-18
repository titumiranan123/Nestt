"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { accountApi, normalizedPhone } from "@/lib/account/api";
import { authHref } from "@/lib/account/auth-navigation";
import { Icon } from "./ui";

export type AuthMode = "login" | "email-login" | "email-register" | "email-verify" | "register" | "verify" | "phone" | "phone-code" | "forgot" | "reset" | "reset-done";

const content: Record<AuthMode, { title: string; description: string; action: string }> = {
  login: {
    title: "Welcome back",
    description: "Sign in with your mobile number and password.",
    action: "Sign in",
  },
  "email-login": {
    title: "Sign in to an existing account",
    description: "Use the email and password from your existing Nestt account. After signing in, you can verify your number in Profile.",
    action: "Sign in",
  },
  "email-register": {
    title: "Create your account with email",
    description: "We’ll email you a six-digit verification code.",
    action: "Send verification code",
  },
  "email-verify": {
    title: "Verify your email",
    description: "Enter the six-digit code from your email to finish creating your account.",
    action: "Verify and create account",
  },
  register: {
    title: "Create your account",
    description: "Enter your mobile number to receive a six-digit signup code by SMS.",
    action: "Send signup code",
  },
  verify: {
    title: "Verify your phone",
    description: "Enter the six-digit code from your SMS, then set up your account.",
    action: "Verify and create account",
  },
  phone: {
    title: "Sign in with your phone",
    description: "We’ll send a six-digit verification code by SMS.",
    action: "Send code",
  },
  "phone-code": {
    title: "Confirm your phone",
    description: "Enter the six-digit code from your SMS.",
    action: "Verify and sign in",
  },
  forgot: {
    title: "Forgot your password?",
    description: "We’ll text a reset code to the verified phone number on your account.",
    action: "Send reset code",
  },
  reset: {
    title: "Set a new password",
    description: "Enter the six-digit code from your SMS and choose a new password.",
    action: "Reset password",
  },
  "reset-done": {
    title: "Password updated",
    description: "You can now sign in with your new password.",
    action: "Back to sign in",
  },
};

export function CustomerAuthForm({
  initialMode = "login", returnTo, onAuthenticated,
}: {
  initialMode?: AuthMode;
  returnTo?: string;
  onAuthenticated: () => void | Promise<void>;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstMode = useRef(initialMode);
  const emailMode = mode === "email-login" || mode === "email-register" || mode === "email-verify";
  const asksForCode = mode === "verify" || mode === "phone-code" || mode === "reset" || mode === "email-verify";
  const newPassword = mode === "verify" || mode === "reset" || mode === "email-register";
  const asksForPassword = newPassword || mode === "login" || mode === "email-login" || mode === "email-verify";
  const loginHref = authHref("/login", returnTo);
  const copy = content[mode];

  useEffect(() => {
    if (mode !== firstMode.current) heading.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (!retryAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (!remaining) setRetryAt(0);
    };
    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function startCooldown() {
    setSeconds(30);
    setRetryAt(Date.now() + 30_000);
  }

  function moveTo(next: AuthMode, message: string) {
    setMode(next);
    setCode("");
    setNotice(message);
    setVisible(false);
    setConfirmation("");
  }

  function emailAddress() {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Enter a valid email address.");
    return value;
  }

  function phoneNumber() {
    const value = normalizedPhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(value)) throw new Error("Enter a valid phone number, including the country code.");
    return value;
  }

  async function run(operation: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not complete this request. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  async function sendAgain() {
    if (seconds) return;
    await run(async () => {
      if (mode === "phone-code") {
        await accountApi.requestPhone(phoneNumber());
        setNotice("A new code has been requested. Check your messages.");
      } else if (mode === "reset") {
        await accountApi.requestPasswordReset(phoneNumber());
        setNotice("If eligible, check your SMS for a new reset code.");
      } else if (mode === "email-verify") {
        await accountApi.resendEmailSignup(emailAddress());
        setNotice("If eligible, check your email for a new verification code.");
      } else {
        await accountApi.requestPhoneSignup(phoneNumber());
        setNotice("If eligible, check your SMS for a new signup code.");
      }
      setCode("");
      startCooldown();
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      if (newPassword) {
        if (password.trim().length < 12) throw new Error("Use at least 12 characters in your password.");
        if (password !== confirmation) throw new Error("The passwords don’t match.");
      }
      if (asksForCode && !/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code.");
      switch (mode) {
        case "login":
          await accountApi.loginWithPhone(phoneNumber(), password);
          break;
        case "email-login":
          await accountApi.login(emailAddress(), password);
          break;
        case "email-register":
          await accountApi.requestEmailSignup(emailAddress(), password);
          moveTo("email-verify", "If eligible, check your email for the verification code.");
          startCooldown();
          return;
        case "email-verify":
          await accountApi.verifyEmailSignup(emailAddress(), code, password);
          await accountApi.login(emailAddress(), password);
          break;
        case "register":
          await accountApi.requestPhoneSignup(phoneNumber());
          moveTo("verify", "If this number can be registered, check your SMS for the signup code.");
          startCooldown();
          return;
        case "verify":
          if (name.trim().length < 2) throw new Error("Enter your full name.");
          await accountApi.verifyPhoneSignup(phoneNumber(), name.trim(), code, password);
          break;
        case "phone":
          await accountApi.requestPhone(phoneNumber());
          moveTo("phone-code", "If eligible, check your SMS for a sign-in code.");
          startCooldown();
          return;
        case "phone-code":
          await accountApi.verifyPhone(phoneNumber(), code);
          break;
        case "forgot":
          await accountApi.requestPasswordReset(phoneNumber());
          moveTo("reset", "If the account has a verified phone, check your SMS for a reset code.");
          startCooldown();
          return;
        case "reset":
          await accountApi.resetPassword(phoneNumber(), code, password);
          setPassword("");
          moveTo("reset-done", "");
          await accountApi.signOut().catch(() => undefined);
          return;
        case "reset-done":
          return;
      }
      setPassword("");
      setConfirmation("");
      await onAuthenticated();
    });
  }

  return (
    <main id="account-content" className="account-card account-auth">
      <Icon name={mode === "reset-done" ? "check" : "lock"} size={28} />
      <h1 ref={heading} tabIndex={-1}>{copy.title}</h1>
      <p>{copy.description}</p>
      {mode === "reset-done" ? (
        <Link className="account-button primary full-width auth-done" href={loginHref}>{copy.action}</Link>
      ) : (
        <form className="account-form" onSubmit={submit}>
          {error && <p className="account-alert" role="alert">{error}</p>}
          {notice && <p className="account-note" role="status">{notice}</p>}
          {!emailMode ? (
            <label className="account-field">Phone number
              <input name="phone" type="tel" autoComplete={mode === "login" ? "username" : "tel"} required maxLength={22}
                readOnly={mode === "phone-code"} placeholder="+880 1XXXXXXXXX" value={phone}
                onChange={(event) => { setPhone(event.target.value); setCode(""); }} />
            </label>
          ) : (
            <label className="account-field">Email address
              <input name="email" type="email" autoComplete={mode === "email-login" || mode === "email-verify" ? "username" : "email"} maxLength={320}
                required value={email} onChange={(event) => { setEmail(event.target.value); setCode(""); }} />
            </label>
          )}
          {asksForCode && (
            <label className="account-field">Verification code
              <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
                required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            </label>
          )}
          {mode === "verify" && (
            <label className="account-field">Full name
              <input name="name" autoComplete="name" minLength={2} maxLength={100} required value={name}
                onChange={(event) => setName(event.target.value)} />
            </label>
          )}
          {asksForPassword && (
            <label className="account-field">{mode === "reset" ? "New password" : "Password"}
              <span className="account-password-control">
                <input name="password" type={visible ? "text" : "password"} autoComplete={newPassword ? "new-password" : "current-password"}
                  minLength={newPassword ? 12 : undefined} maxLength={128} required value={password}
                  onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="account-password-toggle" aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
                  <PasswordVisibilityIcon visible={visible} />
                </button>
              </span>
              {newPassword && <small>Use at least 12 characters.</small>}
            </label>
          )}
          {newPassword && (
            <label className="account-field">Confirm password
              <span className="account-password-control">
                <input name="password-confirmation" type={visible ? "text" : "password"} autoComplete="new-password"
                  minLength={12} maxLength={128} required value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)} />
                <button type="button" className="account-password-toggle" aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
                  <PasswordVisibilityIcon visible={visible} />
                </button>
              </span>
            </label>
          )}
          <button className="account-button primary full-width" type="submit" disabled={busy}>
            {busy ? "Please wait…" : copy.action}
          </button>
        </form>
      )}
      <div className="account-auth-actions">
        {mode === "login" && (
          <>
            <Link className="text-link" href={authHref("/forgot-password", returnTo)}>Forgot password?</Link>
            <Link className="text-link" href={authHref("/register", returnTo)}>Create an account</Link>
            <button type="button" className="text-link" onClick={() => moveTo("phone", "")}>Sign in with SMS code</button>
            <button type="button" className="text-link" onClick={() => moveTo("email-login", "")}>Sign in with email</button>
          </>
        )}
        {mode !== "login" && mode !== "reset-done" && <Link className="text-link" href={loginHref}>Back to sign in</Link>}
        {mode === "register" && <Link className="text-link" href={authHref("/verify-phone", returnTo)}>Already have a signup code?</Link>}
        {mode === "register" && <button type="button" className="text-link" onClick={() => moveTo("email-register", "")}>Use email instead</button>}
        {mode === "email-register" && <button type="button" className="text-link" onClick={() => moveTo("register", "")}>Use phone instead</button>}
        {mode === "email-verify" && <button type="button" className="text-link" onClick={() => moveTo("email-register", "")}>Change email or password</button>}
        {mode === "email-login" && <button type="button" className="text-link" onClick={() => moveTo("login", "")}>Use phone and password</button>}
        {mode === "phone" && <button type="button" className="text-link" onClick={() => moveTo("login", "")}>Use phone and password</button>}
        {mode === "forgot" && <Link className="text-link" href={authHref("/reset-password", returnTo)}>Already have a reset code?</Link>}
        {asksForCode && <button type="button" className="text-link" disabled={busy || !!seconds || (mode === "email-verify" ? !email : !phone)}
          onClick={() => void sendAgain()}>{seconds ? `Resend in ${seconds}s` : "Send a new code"}</button>}
        {mode === "phone-code" && <button type="button" className="text-link" disabled={busy}
          onClick={() => { moveTo("phone", ""); setError(""); }}>Use a different number</button>}
      </div>
      <Link href="/products" className="text-link account-auth-shop">Continue shopping <Icon name="arrow" size={14} /></Link>
    </main>
  );
}

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {visible ? <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.3 4.4 9 7-.3 1.1-1 2.2-2 3.2" /><path d="M6.2 6.2C4.4 7.4 3.3 9.3 3 12c.7 2.6 4 7 9 7 1 0 2-.2 2.8-.5" /></>
      : <><path d="M2.8 12s3.2-6 9.2-6 9.2 6 9.2 6-3.2 6-9.2 6-9.2-6-9.2-6Z" /><circle cx="12" cy="12" r="2.6" /></>}
  </svg>;
}
