import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { env, isSecureCookie } from "@/lib/env";
import { isStaffRole } from "@/lib/rbac/roles";
import { isPermission, type Permission } from "@/lib/rbac/permissions";
import { rotateAuthToken } from "@/lib/auth/token";
import { readLoginCredentials } from "@/lib/auth/validation";

type BackendLogin = {
  user: { id: string; name: string; email: string; role: string; permissions: Permission[] };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type CredentialAuthUser = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
};

type CredentialErrorCode = "INVALID_CREDENTIALS" | "NOT_ADMIN" | "RATE_LIMITED" | "SERVER_UNAVAILABLE";

class AdminCredentialsSignin extends CredentialsSignin {
  constructor(code: CredentialErrorCode) {
    super();
    this.code = code;
  }
}

function isBackendLogin(value: unknown): value is BackendLogin {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<BackendLogin>;
  const user = candidate.user as Partial<BackendLogin["user"]> | undefined;
  return typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.expiresIn === "number" && candidate.expiresIn > 0 &&
    typeof user === "object" && user !== null &&
    typeof user.id === "string" && typeof user.name === "string" &&
    typeof user.email === "string" && typeof user.role === "string" &&
    Array.isArray(user.permissions) && user.permissions.every(isPermission);
}

async function revokeRefreshToken(refreshToken: string): Promise<void> {
  try {
    await fetch(`${env.BACKEND_API_URL}/auth/logout`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // A failed best-effort revoke must not disclose the token or backend error.
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: env.AUTH_TRUST_HOST,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: isSecureCookie ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: isSecureCookie },
    },
  },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = readLoginCredentials(credentials.email, credentials.password);
        if (!parsed) throw new AdminCredentialsSignin("INVALID_CREDENTIALS");
        let response: Response;
        try {
          response = await fetch(`${env.BACKEND_API_URL}/auth/email/login`, {
            method: "POST",
            headers: { "content-type": "application/json", accept: "application/json" },
            body: JSON.stringify(parsed),
            cache: "no-store",
            signal: AbortSignal.timeout(10_000),
          });
        } catch {
          throw new AdminCredentialsSignin("SERVER_UNAVAILABLE");
        }
        if (!response.ok) {
          if (response.status === 429) throw new AdminCredentialsSignin("RATE_LIMITED");
          if (response.status === 403) throw new AdminCredentialsSignin("NOT_ADMIN");
          if (response.status >= 500 || response.status === 503) throw new AdminCredentialsSignin("SERVER_UNAVAILABLE");
          throw new AdminCredentialsSignin("INVALID_CREDENTIALS");
        }
        let payload: unknown;
        try { payload = await response.json(); } catch { throw new AdminCredentialsSignin("SERVER_UNAVAILABLE"); }
        if (!isBackendLogin(payload)) throw new AdminCredentialsSignin("SERVER_UNAVAILABLE");
        if (!isStaffRole(payload.user.role)) {
          await revokeRefreshToken(payload.refreshToken);
          throw new AdminCredentialsSignin("NOT_ADMIN");
        }
        return {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email,
          role: payload.user.role,
          permissions: payload.user.permissions,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
          accessTokenExpiresAt: Date.now() + payload.expiresIn * 1000,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & Partial<CredentialAuthUser>;
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        token.permissions = [...user.permissions];
        token.accessToken = authUser.accessToken;
        token.refreshToken = authUser.refreshToken;
        token.accessTokenExpiresAt = authUser.accessTokenExpiresAt;
      }
      if (!Array.isArray(token.permissions)) token.permissions = [];
      return rotateAuthToken(token);
    },
    async session({ session, token }) {
      session.error = token.authError;
      if (token.authError || !token.sub || !isStaffRole(token.role)) {
        delete (session as { user?: typeof session.user }).user;
        return session;
      }
      session.user = {
        id: token.sub,
        emailVerified: null,
        name: token.name ?? null,
        email: token.email ?? "",
        role: token.role,
        permissions: Array.isArray(token.permissions)
          ? token.permissions.filter(isPermission)
          : [],
      };
      return session;
    },
  },
  events: {
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      if (typeof token?.refreshToken === "string") await revokeRefreshToken(token.refreshToken);
    },
  },
});
