import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/rbac/roles";
import { can } from "@/lib/rbac/can";
import { permissionForAdminPath } from "@/lib/admin-navigation";

export const proxy = auth((request) => {
  const user = request.auth?.user;
  const sessionExpired = request.auth?.error === "RefreshTokenError";
  if (request.nextUrl.pathname === "/login") {
    if (sessionExpired) return NextResponse.next();
    if (user?.id && isStaffRole(user.role)) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }
  if (sessionExpired) return NextResponse.redirect(new URL("/login?error=SessionExpired", request.url));
  if (!user?.id || !isStaffRole(user.role)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  const requiredPermission = permissionForAdminPath(request.nextUrl.pathname);
  if (!requiredPermission || !can(requiredPermission, user.permissions)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/login"] };
