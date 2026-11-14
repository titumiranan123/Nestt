export default function Loading() {
  return (
    <div role="status" className="account-loading">
      <div className="skeleton skeleton-title" />
      <div className="skeleton" />
      <span className="sr-only">Loading your account…</span>
    </div>
  );
}
