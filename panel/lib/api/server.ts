import "server-only";
import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";
import { env, isSecureCookie } from "@/lib/env";
import { ApiError, toApiError } from "@/lib/api/errors";
import { isStaffRole } from "@/lib/rbac/roles";

async function getServerToken(): Promise<string> {
  const currentHeaders = await headers();
  const decoded = await getToken({
    req: { headers: new Headers(currentHeaders) },
    secret: env.AUTH_SECRET,
    secureCookie: isSecureCookie,
  });
  if (!decoded || !isStaffRole(decoded.role)) {
    throw new ApiError("Your session has expired. Sign in again.", { status: 401 });
  }
  const expiry = typeof decoded.accessTokenExpiresAt === "number" ? decoded.accessTokenExpiresAt : 0;
  if (typeof decoded.accessToken !== "string" || expiry <= Date.now() + 60_000) {
    throw new ApiError("Your session has expired. Sign in again.", { status: 401 });
  }
  return decoded.accessToken;
}

export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getServerToken();
  const url = new URL(path.replace(/^\//, ""), `${env.BACKEND_API_URL}/`);
  const response = await fetch(url, {
    ...init,
    headers: { ...Object.fromEntries(new Headers(init.headers)), authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    let body: unknown;
    try { body = await response.json(); } catch { body = null; }
    throw toApiError(body, response.status);
  }
  return response.json() as Promise<T>;
}
