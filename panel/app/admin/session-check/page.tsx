"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/errors";

export default function SessionCheckPage() {
  const { data: session, status } = useSession();
  const apiQuery = useQuery({
    queryKey: ["session-check", "api-me"],
    queryFn: () => apiClient<unknown>(endpoints.auth.me),
    enabled: false,
    meta: { silent: true },
  });

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header><p className="text-xs font-semibold uppercase tracking-wider text-accent">Integration smoke check</p><h1 className="mt-1 text-2xl font-bold text-ink">Session check</h1><p className="mt-2 text-sm text-muted">Inspect the safe session fields and verify the BFF connection.</p></header>
      <div className="rounded-xl border border-line bg-white p-5">
        <h2 className="font-semibold">Current session</h2>
        {status === "loading" ? <p className="mt-3 text-sm text-muted">Loading session…</p> : (
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <dt className="text-muted">User</dt><dd>{session?.user?.name ?? session?.user?.email ?? "Not signed in"}</dd>
            <dt className="text-muted">User ID</dt><dd className="break-all">{session?.user?.id ?? "—"}</dd>
            <dt className="text-muted">Role</dt><dd>{session?.user?.role ?? "—"}</dd>
            <dt className="text-muted">Permissions</dt><dd>{session?.user?.permissions?.join(", ") || "None"}</dd>
          </dl>
        )}
      </div>
      <div className="rounded-xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Backend identity</h2><p className="mt-1 text-sm text-muted">Calls GET /auth/me through /api/bff.</p></div><button type="button" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={apiQuery.isFetching} onClick={() => { void apiQuery.refetch(); }}>{apiQuery.isFetching ? "Checking…" : "Test API"}</button></div>
        {apiQuery.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{getErrorMessage(apiQuery.error)}</p> : null}
        {apiQuery.data !== undefined ? <pre className="mt-4 max-h-96 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(apiQuery.data, null, 2)}</pre> : null}
      </div>
    </section>
  );
}
