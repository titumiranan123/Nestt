"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { accountApi, normalizedPhone } from "@/lib/account/api";
import { authHref } from "@/lib/account/auth-navigation";
import { useAccount } from "./AccountProvider";
import { Icon, Modal, PageHeading, handleTabKeys } from "./ui";

export function ProfilePage() {
  const { state: { profile }, saveProfile, signOut, busy, notify, setProfile } = useAccount();
  const [tab, setTab] = useState<"personal" | "security">("personal");
  const [name, setName] = useState(profile.name);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [phoneDialog, setPhoneDialog] = useState(false);
  const changed = name.trim() !== profile.name;
  const initials = profile.name.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = name.trim();
    if (value.length < 2) {
      notify("Enter a name with at least two characters.", true);
      return;
    }
    if (await saveProfile(value)) setName(value);
  }

  return (
    <>
      <PageHeading title="Profile & security" description="Manage your contact details and account access." />
      <div className="account-tabs" role="tablist" aria-label="Profile settings" onKeyDown={handleTabKeys}>
        {(["personal", "security"] as const).map((section) => (
          <button key={section} type="button" role="tab" id={`${section}-tab`}
            aria-controls={tab === section ? `${section}-panel` : undefined} aria-selected={tab === section}
            tabIndex={tab === section ? 0 : -1} className={tab === section ? "active" : ""}
            onClick={() => setTab(section)}>
            {section === "personal" ? "Personal information" : "Security"}
          </button>
        ))}
      </div>
      {tab === "personal" ? (
        <div className="profile-grid" role="tabpanel" id="personal-panel" aria-labelledby="personal-tab">
          <section className="account-card">
            <div className="profile-form-heading">
              <span className="account-avatar">{initials}</span>
              <div><h2 className="account-section-title">Personal information</h2><p>Keep your account details up to date.</p></div>
            </div>
            <form className="account-form" onSubmit={submit}>
              <label className="account-field">Full name
                <input name="name" autoComplete="name" required maxLength={100} value={name}
                  onChange={(event) => setName(event.target.value)} />
              </label>
              <div className="profile-form-actions">
                <button className="account-button primary" type="submit" disabled={busy || !changed}>Save changes</button>
                <button className="account-button" type="button" disabled={busy || !changed} onClick={() => setName(profile.name)}>Cancel</button>
              </div>
            </form>
          </section>
          <aside className="profile-status">
            <Icon name="shield" size={28} />
            <h2>Phone verification</h2>
            <p>Use a verified phone for sign-in and account recovery.</p>
            <div>
              <span className={profile.isPhoneVerified ? "verified-dot" : "neutral-dot"}>
                <Icon name={profile.isPhoneVerified ? "check" : "lock"} size={13} />
              </span>
              <div>
                <strong>{profile.isPhoneVerified ? "Phone verified" : profile.phone ? "Phone not verified" : "No phone linked"}</strong>
                {profile.phone && <p>{profile.phone}</p>}
                {!profile.isPhoneVerified && (
                  <button type="button" className="text-link" onClick={() => setPhoneDialog(true)}>
                    {profile.phone ? "Verify phone" : "Add phone"}
                  </button>
                )}
              </div>
            </div>
            {profile.email && <div><div><strong>Account email</strong><p>{profile.email}</p></div></div>}
            {profile.isPhoneVerified && (
              <a href="mailto:hello@nestt.com" className="text-link">Contact support to change your phone <Icon name="arrow" size={15} /></a>
            )}
          </aside>
        </div>
      ) : (
        <section className="account-card security-panel" role="tabpanel" id="security-panel" aria-labelledby="security-tab">
          <Icon name="shield" size={32} />
          <h2 className="account-section-title">Account security</h2>
          {profile.isPhoneVerified ? (
            <div className="security-action">
              <div><h3>Reset your password</h3><p>Use an SMS code to set a new password.</p></div>
              <Link className="account-button" href={authHref("/forgot-password", "/account/profile")}>Reset password <Icon name="arrow" size={15} /></Link>
            </div>
          ) : (
            <div className="security-action">
              <div><h3>Enable phone recovery</h3><p>Verify your phone before using SMS password reset.</p></div>
              <button className="account-button" onClick={() => setPhoneDialog(true)}>Verify phone <Icon name="arrow" size={15} /></button>
            </div>
          )}
          <div className="security-action">
            <div><h3>Sign out</h3><p>End this session on your current device.</p></div>
            <button className="account-button" disabled={busy} onClick={() => setSignOutOpen(true)}>Sign out <Icon name="logout" size={15} /></button>
          </div>
        </section>
      )}
      {phoneDialog && <VerifyPhoneDialog initialValue={profile.phone} onClose={() => setPhoneDialog(false)} onVerified={(next) => {
        setProfile(next);
        setPhoneDialog(false);
        notify("Your phone number has been verified.");
      }} />}
      {signOutOpen && (
        <Modal title="Sign out of your account?" onClose={() => setSignOutOpen(false)}>
          <div className="dialog-actions">
            <button className="account-button" onClick={() => setSignOutOpen(false)}>Stay here</button>
            <button className="account-button primary" disabled={busy} onClick={() => void signOut()}>Sign out</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function VerifyPhoneDialog({ initialValue, onVerified, onClose }: {
  initialValue: string;
  onVerified: (profile: Awaited<ReturnType<typeof accountApi.profile>>) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const phone = normalizedPhone(value);
      if (sent) onVerified(await accountApi.verifyContactPhone(phone, code));
      else {
        await accountApi.requestContactPhoneCode(phone);
        setSent(true);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to verify your phone number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Verify your phone" onClose={onClose}>
      <form className="account-form" onSubmit={submit}>
        {error && <p className="account-alert" role="alert">{error}</p>}
        {sent && <p className="account-note" role="status">Enter the six-digit code from your SMS.</p>}
        <label className="account-field">Phone number
          <input type="tel" autoComplete="tel"
            maxLength={22} required readOnly={sent || !!initialValue}
            value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        {sent && (
          <label className="account-field">Verification code
            <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
              required value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
        )}
        <button className="account-button primary full-width" disabled={busy} type="submit">{busy ? "Please wait…" : sent ? "Verify" : "Send verification code"}</button>
      </form>
    </Modal>
  );
}
