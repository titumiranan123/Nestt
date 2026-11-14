import type { DefaultSession } from "next-auth";
import type { Permission } from "@/lib/rbac/permissions";
import type { Role } from "@/lib/rbac/roles";

declare module "next-auth" {
  interface User {
    role: Role;
    permissions: Permission[];
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: Permission[];
      name: string | null;
      email: string | null;
      emailVerified: Date | null;
    } & DefaultSession["user"];
    error?: "RefreshTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    permissions?: Permission[];
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpiresAt?: number;
    authError?: "RefreshTokenError";
  }
}
