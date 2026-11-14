import type { JWT } from "next-auth/jwt";
import { env } from "@/lib/env";
import { isStaffRole } from "@/lib/rbac/roles";
import type { StaffRole } from "@/lib/rbac/roles";
import { isPermission, type Permission } from "@/lib/rbac/permissions";

type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email?: string | null; role: StaffRole; permissions: Permission[] };
};

type RotatedTokens = Omit<RefreshResult, "user">;

class RefreshVerificationError extends Error {
  constructor(readonly rotated: RotatedTokens) {
    super("The refreshed account is not permitted to use the admin panel.");
  }
}

const refreshes = new Map<string, { promise: Promise<RefreshResult>; expiresAt: number }>();
const refreshResultGraceMs = 15_000;

async function requestRefresh(refreshToken: string, expectedUserId?: string): Promise<RefreshResult> {
  const response = await fetch(`${env.BACKEND_API_URL}/auth/token/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Refresh rejected");
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null) throw new Error("Invalid refresh response");
  const result = payload as Partial<RotatedTokens>;
  if (typeof result.accessToken !== "string" || typeof result.refreshToken !== "string" || typeof result.expiresIn !== "number") {
    throw new Error("Invalid refresh response");
  }
  let meResponse: Response;
  try {
    meResponse = await fetch(`${env.BACKEND_API_URL}/auth/me`, {
      headers: { authorization: `Bearer ${result.accessToken}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new RefreshVerificationError(result as RotatedTokens);
  }
  if (!meResponse.ok) throw new RefreshVerificationError(result as RotatedTokens);
  let mePayload: unknown;
  try { mePayload = await meResponse.json(); } catch { throw new RefreshVerificationError(result as RotatedTokens); }
  if (typeof mePayload !== "object" || mePayload === null || !("user" in mePayload)) {
    throw new RefreshVerificationError(result as RotatedTokens);
  }
  const user = mePayload.user;
  const role = typeof user === "object" && user !== null && "role" in user ? user.role : undefined;
  if (typeof user !== "object" || user === null || !("id" in user) || !("name" in user) || !("role" in user) ||
      typeof user.id !== "string" || typeof user.name !== "string" || typeof user.role !== "string" ||
      ("email" in user && user.email !== null && typeof user.email !== "string") ||
      !("permissions" in user) || !Array.isArray(user.permissions) || !user.permissions.every(isPermission) ||
      (expectedUserId && user.id !== expectedUserId) || typeof role !== "string" || !isStaffRole(role)) {
    throw new RefreshVerificationError(result as RotatedTokens);
  }
  return { ...(result as RotatedTokens), user: { id: user.id, name: user.name, email: "email" in user && typeof user.email === "string" ? user.email : null, role, permissions: user.permissions } };
}

export async function rotateAuthToken(token: JWT): Promise<JWT> {
  if (token.authError === "RefreshTokenError") return token;
  if (!token.refreshToken || typeof token.refreshToken !== "string") {
    return { ...token, authError: "RefreshTokenError" };
  }
  const currentExpiry = typeof token.accessTokenExpiresAt === "number" ? token.accessTokenExpiresAt : 0;
  if (currentExpiry > Date.now() + 60_000) return token;

  const key = token.refreshToken;
  let entry = refreshes.get(key);
  if (entry && entry.expiresAt <= Date.now()) {
    refreshes.delete(key);
    entry = undefined;
  }
  if (!entry) {
    const promise = requestRefresh(key, token.sub);
    entry = { promise, expiresAt: Number.POSITIVE_INFINITY };
    refreshes.set(key, entry);
    void promise.then(
      () => {
        entry!.expiresAt = Date.now() + refreshResultGraceMs;
        const expiryTimer = setTimeout(() => {
          if (refreshes.get(key) === entry) refreshes.delete(key);
        }, refreshResultGraceMs);
        expiryTimer.unref?.();
      },
      () => { if (refreshes.get(key) === entry) refreshes.delete(key); },
    );
  }
  try {
    const result = await entry.promise;
    return {
      ...token,
      sub: result.user.id,
      name: result.user.name,
      email: result.user.email ?? token.email,
      role: result.user.role,
      permissions: [...result.user.permissions],
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: Date.now() + result.expiresIn * 1000,
      authError: undefined,
    };
  } catch (error) {
    if (error instanceof RefreshVerificationError) {
      return {
        ...token,
        accessToken: error.rotated.accessToken,
        refreshToken: error.rotated.refreshToken,
        accessTokenExpiresAt: Date.now() + error.rotated.expiresIn * 1000,
        authError: "RefreshTokenError",
      };
    }
    return { ...token, authError: "RefreshTokenError" };
  }
}
