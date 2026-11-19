"use client";

import { signOut } from "next-auth/react";
import { ApiError, toApiError } from "@/lib/api/errors";

type ApiRequestOptions = RequestInit & { authRequired?: boolean };

let signOutPromise: Promise<unknown> | null = null;

async function forceSignOut(): Promise<void> {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  if (!signOutPromise) {
    signOutPromise = signOut({ redirect: false }).finally(() => {
      window.location.replace("/login?error=SessionExpired&signedOut=1");
    });
  }
  await signOutPromise;
}

async function requestApi(path: string, options: ApiRequestOptions): Promise<Response> {
  const { authRequired = true, ...init } = options;
  const response = await fetch(`/api/bff${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { accept: "application/json", ...Object.fromEntries(new Headers(init.headers)) },
  });
  if (response.status === 401 && authRequired) {
    await forceSignOut();
    throw new ApiError("Your session has expired. Sign in again.", { status: 401 });
  }
  if (!response.ok) {
    let payload: unknown;
    try { payload = await response.json(); } catch { payload = null; }
    throw toApiError(payload, response.status);
  }
  return response;
}

export async function apiClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await requestApi(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await requestApi(path, { headers: { accept: "text/csv" } });
  return response.blob();
}
