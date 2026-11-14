"use client";

import { useState, type FormEvent } from "react";
import { useAccount } from "./AccountProvider";
import { Badge, Icon, Modal, PageHeading, handleTabKeys } from "./ui";

export function ProfilePage() {
  const { state, saveProfile, signOut } = useAccount();
  const [tab, setTab] = useState("personal");
  const [draft, setDraft] = useState({ ...state.profile });
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const changed =
    draft.name !== state.profile.name ||
    draft.email !== state.profile.email ||
    draft.phone !== state.profile.phone;
  function submit(e: FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    const email = draft.email.trim();
    const phone = draft.phone.replace(/[\s()-]/g, "");
    if (!name || !/^\+?\d{7,15}$/.test(phone)) {
      setError("Enter your name and a valid phone number.");
      return;
    }
    saveProfile({ ...draft, name, email, phone });
    setDraft({ ...draft, name, email, phone });
    setError("");
  }
  return (
    <>
      <PageHeading
        title="Profile & security"
        description="Your details, safely at home."
      />
      <div
        className="account-tabs"
        role="tablist"
        aria-label="Profile settings"
        onKeyDown={handleTabKeys}
      >
        <button
          role="tab"
          id="personal-tab"
          aria-controls={tab === "personal" ? "personal-panel" : undefined}
          tabIndex={tab === "personal" ? 0 : -1}
          aria-selected={tab === "personal"}
          className={tab === "personal" ? "active" : ""}
          onClick={() => setTab("personal")}
        >
          Personal information
        </button>
        <button
          role="tab"
          id="security-tab"
          aria-controls={tab === "security" ? "security-panel" : undefined}
          tabIndex={tab === "security" ? 0 : -1}
          aria-selected={tab === "security"}
          className={tab === "security" ? "active" : ""}
          onClick={() => setTab("security")}
        >
          Security
        </button>
      </div>
      {tab === "personal" ? (
        <div
          className="profile-grid"
          role="tabpanel"
          id="personal-panel"
          aria-labelledby="personal-tab"
        >
          <section className="account-card">
            <div className="profile-form-heading">
              <span className="account-avatar">
                {state.profile.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <h2 className="account-section-title">Personal information</h2>
                <p>Keep your account details up to date.</p>
              </div>
            </div>
            <form className="account-form" onSubmit={submit}>
              {error && (
                <p role="alert" className="account-alert">
                  {error}
                </p>
              )}
              <label className="account-field">
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </label>
              <label className="account-field">
                <span className="field-label-line">
                  Email address{" "}
                  {state.profile.isEmailVerified &&
                  draft.email === state.profile.email ? (
                    <Badge tone="good">
                      <Icon name="check" size={12} />
                      Verified sample
                    </Badge>
                  ) : (
                    <Badge tone="pending">Unverified</Badge>
                  )}
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={draft.email}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, email: e.target.value }))
                  }
                />
              </label>
              <label className="account-field">
                <span className="field-label-line">
                  Mobile number{" "}
                  {state.profile.isPhoneVerified &&
                  draft.phone === state.profile.phone ? (
                    <Badge tone="good">
                      <Icon name="check" size={12} />
                      Verified sample
                    </Badge>
                  ) : (
                    <Badge tone="pending">Unverified</Badge>
                  )}
                </span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  required
                  maxLength={20}
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </label>
              <p className="account-note">
                Profile changes are saved to this demo only. Changing an email
                or phone clears its sample verification status. Live contact
                verification requires a connected account.
              </p>
              <div className="profile-form-actions">
                <button
                  className="account-button primary"
                  type="submit"
                  disabled={!changed}
                >
                  Save changes
                </button>
                <button
                  className="account-button"
                  type="button"
                  disabled={!changed}
                  onClick={() => {
                    setDraft({ ...state.profile });
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
          <aside className="profile-status">
            <Icon name="shield" size={28} />
            <h2>A little peace of mind.</h2>
            <p>Keep your details current and your account protected.</p>
            <div>
              <span
                className={
                  state.profile.isEmailVerified ? "verified-dot" : "neutral-dot"
                }
              >
                <Icon
                  name={state.profile.isEmailVerified ? "check" : "lock"}
                  size={13}
                />
              </span>
              <div>
                <strong>
                  {state.profile.isEmailVerified
                    ? "Email verified (sample)"
                    : "Email not verified"}
                </strong>
                <p>{state.profile.email}</p>
              </div>
            </div>
            <div>
              <span
                className={
                  state.profile.isPhoneVerified ? "verified-dot" : "neutral-dot"
                }
              >
                <Icon
                  name={state.profile.isPhoneVerified ? "check" : "lock"}
                  size={13}
                />
              </span>
              <div>
                <strong>
                  {state.profile.isPhoneVerified
                    ? "Phone verified (sample)"
                    : "Phone not verified"}
                </strong>
                <p>{state.profile.phone}</p>
              </div>
            </div>
            <button className="text-link" onClick={() => setTab("security")}>
              Manage security <Icon name="arrow" size={16} />
            </button>
          </aside>
        </div>
      ) : (
        <section
          className="account-card security-panel"
          role="tabpanel"
          id="security-panel"
          aria-labelledby="security-tab"
        >
          <Icon name="shield" size={32} />
          <h2 className="account-section-title">A little peace of mind.</h2>
          <p>Use a unique password and keep access to your email account.</p>
          <div className="security-action">
            <div>
              <h3>Reset your password</h3>
              <p>
                Receive a verification code by email, then choose a new
                password.
              </p>
            </div>
            <button
              className="account-button"
              onClick={() => setResetOpen(true)}
            >
              Reset password <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="security-action">
            <div>
              <h3>Sign out</h3>
              <p>Leave this demo account on your current device.</p>
            </div>
            <button
              className="account-button"
              onClick={() => setSignOutOpen(true)}
            >
              Sign out <Icon name="logout" size={15} />
            </button>
          </div>
          <p className="account-note">
            This frontend preview does not create an authenticated session.
            Password resets use the real service only when the backend is
            configured; passwords are never saved in browser storage.
          </p>
        </section>
      )}
      {tab === "personal" && (
        <section className="security-preview">
          <div className="account-section-heading">
            <h2 className="account-section-title">Security</h2>
            <button className="text-link" onClick={() => setTab("security")}>
              Manage security <Icon name="arrow" size={15} />
            </button>
          </div>
          <p>Manage your password and account access.</p>
          <button
            className="security-preview-row"
            onClick={() => setResetOpen(true)}
          >
            <Icon name="lock" />
            <span>
              <strong>Reset password</strong>
              <small>
                Choose a fresh password with an email verification code.
              </small>
            </span>
            <Icon name="arrow" size={16} />
          </button>
        </section>
      )}
      {resetOpen && <PasswordResetDialog onClose={() => setResetOpen(false)} />}
      {signOutOpen && (
        <Modal
          title="Leave this demo account?"
          onClose={() => setSignOutOpen(false)}
        >
          <p className="dialog-description">
            Your changes remain saved on this device.
          </p>
          <div className="dialog-actions">
            <button
              className="account-button"
              onClick={() => setSignOutOpen(false)}
            >
              Stay here
            </button>
            <button className="account-button primary" onClick={signOut}>
              Sign out
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function PasswordResetDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (step === "reset" && password !== confirm) {
      setError("Your new passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          step === "request"
            ? { action: "request", email: email.trim() }
            : { action: "reset", email: email.trim(), code, password },
        ),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          body.message || "Could not complete your request. Please try again.",
        );
      if (step === "request") setStep("reset");
      else {
        setPassword("");
        setConfirm("");
        setCode("");
        setStep("done");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        step === "done"
          ? "Password updated"
          : step === "reset"
            ? "Set a new password"
            : "Reset your password"
      }
      onClose={onClose}
    >
      {step === "done" ? (
        <>
          <p className="account-success">
            Your password has been updated. You can now sign in with your new
            password.
          </p>
          <div className="dialog-actions">
            <button className="account-button primary" onClick={onClose}>
              Back to account
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="dialog-description">
            {step === "request"
              ? "Enter the email for your live Nestt account. We’ll send a code if it is registered. This does not change the demo profile."
              : `If ${email} is registered, check its inbox for a six-digit verification code.`}
          </p>
          <form className="account-form" onSubmit={submit}>
            {error && (
              <p role="alert" className="account-alert">
                {error}
              </p>
            )}
            {step === "request" ? (
              <label className="account-field">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : (
              <>
                <label className="account-field">
                  Verification code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <label className="account-field">
                  New password
                  <div className="password-input">
                    <input
                      type={visible ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={12}
                      maxLength={128}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      className="account-icon-button"
                      type="button"
                      aria-label={visible ? "Hide password" : "Show password"}
                      aria-pressed={visible}
                      onClick={() => setVisible(!visible)}
                    >
                      <Icon name="eye" size={17} />
                    </button>
                  </div>
                  <small>Use at least 12 characters.</small>
                </label>
                <label className="account-field">
                  Confirm new password
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={128}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                <button
                  className="text-link"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setStep("request");
                    setError("");
                    setPassword("");
                    setConfirm("");
                  }}
                >
                  Use a different email or request another code
                </button>
              </>
            )}
            <button
              className="account-button primary full-width"
              disabled={busy}
              type="submit"
            >
              {busy
                ? "Please wait…"
                : step === "request"
                  ? "Send verification code"
                  : "Update password"}
            </button>
          </form>
        </>
      )}
    </Modal>
  );
}
