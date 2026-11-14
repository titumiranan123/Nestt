"use client";
export default function AccountError({ reset }: { reset: () => void }) {
  return (
    <div className="account-empty" role="alert">
      <h2>Something didn’t load.</h2>
      <p>Your saved changes are still on this device. Please try again.</p>
      <button className="account-button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
