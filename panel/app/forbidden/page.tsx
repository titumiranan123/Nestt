import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-canvas p-6">
      <section className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wider text-accent">Access denied</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">You do not have permission to view this page.</h1>
        <p className="mt-3 text-sm text-muted">Ask a Super Admin to review your role permissions.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white" href="/admin">Back to dashboard</Link>
      </section>
    </main>
  );
}
