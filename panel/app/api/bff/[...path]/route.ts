import { encode, getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { BffMethod } from "@/lib/rbac/route-permissions";
import { routeForRequest } from "@/lib/rbac/route-permissions";
import { can } from "@/lib/rbac/can";
import { isStaffRole } from "@/lib/rbac/roles";
import { env, isSecureCookie } from "@/lib/env";
import { rotateAuthToken } from "@/lib/auth/token";

const bodyLimit = 10 * 1024 * 1024;
const timeoutMs = 15_000;
const cookieName = isSecureCookie ? "__Secure-authjs.session-token" : "authjs.session-token";
const cookieMaxAge = 30 * 24 * 60 * 60;
// Auth.js chunks session cookies at 4096 bytes, reserving 160 bytes for headers.
const authCookieChunkSize = 4096 - 160;
const mutatingMethods = new Set<BffMethod>(["POST", "PUT", "PATCH", "DELETE"]);
const hopByHopHeaders = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host", "cookie", "authorization"]);
const sensitiveResponseHeaders = new Set(["set-cookie", "location", "content-location", "server", "x-powered-by"]);

type RouteContext = { params: Promise<{ path: string[] }> };

function jsonError(status: number, message: string, error: string): NextResponse {
  return NextResponse.json({ statusCode: status, message, error }, { status, headers: { "cache-control": "no-store" } });
}

async function attachRotatedCookie(response: Response, encoded: string | null, request: NextRequest): Promise<Response> {
  if (!encoded) return response;
  const nextResponse = new NextResponse(response.body, { status: response.status, statusText: response.statusText, headers: response.headers });
  const options = {
    httpOnly: true,
    secure: isSecureCookie,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  } as const;
  for (const existing of request.cookies.getAll()) {
    if (existing.name === cookieName || existing.name.startsWith(`${cookieName}.`)) {
      nextResponse.cookies.set(existing.name, "", { ...options, maxAge: 0 });
    }
  }
  const count = Math.ceil(encoded.length / authCookieChunkSize);
  if (count <= 1) nextResponse.cookies.set(cookieName, encoded, options);
  else {
    for (let index = 0; index < count; index += 1) {
      nextResponse.cookies.set(`${cookieName}.${index}`, encoded.slice(index * authCookieChunkSize, (index + 1) * authCookieChunkSize), options);
    }
  }
  return nextResponse;
}

function limitedBody(body: ReadableStream<Uint8Array>, limit: number): ReadableStream<Uint8Array> {
  let total = 0;
  return body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      total += chunk.byteLength;
      if (total > limit) throw new RangeError("Request body too large");
      controller.enqueue(chunk);
    },
  }));
}

async function backendError(response: Response): Promise<NextResponse> {
  let body: unknown;
  try { body = await response.json(); } catch { body = null; }
  const parsed = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
  const rawMessage = typeof parsed.message === "string" ? parsed.message : "";
  const message = response.status < 500 && !/(?:\bat\s.+\(|Error:|https?:\/\/)/i.test(rawMessage) && !rawMessage.includes(env.BACKEND_API_URL)
    ? rawMessage
    : "The backend could not complete the request.";
  const normalized: Record<string, unknown> = {
    statusCode: response.status,
    message,
    error: response.status < 500 && typeof parsed.error === "string" && /^[\w ]{1,60}$/.test(parsed.error)
      ? parsed.error
      : response.status >= 500 ? "ServerError" : "RequestError",
  };
  if (Array.isArray(parsed.issues)) normalized.issues = parsed.issues.filter((issue) => {
    if (typeof issue !== "object" || issue === null) return false;
    const item = issue as { path?: unknown; message?: unknown };
    return typeof item.path === "string" && typeof item.message === "string" && !/(?:\bat\s.+\(|Error:|https?:\/\/)/i.test(item.message) && !item.message.includes(env.BACKEND_API_URL);
  }).map((issue) => {
    const item = issue as { path: string; message: string };
    return { path: item.path, message: item.message };
  });
  return NextResponse.json(normalized, { status: response.status, headers: { "cache-control": "no-store" } });
}

async function handle(request: NextRequest, context: RouteContext): Promise<Response> {
  const requestId = crypto.randomUUID();
  const { path } = await context.params;
  const cleanPath = path.join("/");
  if (!path.length || path.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\") || segment.includes("/") || segment.includes("%"))) {
    return jsonError(403, "This API route is not available.", "Forbidden");
  }
  const method = request.method as BffMethod;
  const route = routeForRequest(method, cleanPath);
  if (!route) return jsonError(403, "This API route is not available.", "Forbidden");
  let token = null;
  if (route.permission) {
    token = await getToken({ req: request, secret: env.AUTH_SECRET, secureCookie: isSecureCookie, cookieName });
    if (!token || !isStaffRole(token.role)) return jsonError(401, "Sign in is required.", "Unauthorized");
    if (!can(route.permission, token.permissions ?? [])) return jsonError(403, "You do not have permission to perform this action.", "Forbidden");
  }

  if (mutatingMethods.has(method)) {
    const origin = request.headers.get("origin");
    const expectedOrigin = new URL(env.AUTH_URL ?? request.url).origin;
    if (!origin || origin !== expectedOrigin) return jsonError(403, "Request origin is not allowed.", "Forbidden");
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const requestBodyLimit = route.bodyLimit ?? bodyLimit;
  if (Number.isFinite(contentLength) && contentLength > requestBodyLimit) return jsonError(413, "Request body is too large.", "PayloadTooLarge");

  const oldRefreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : undefined;
  if (token) token = await rotateAuthToken(token);
  const rotatedCookie = oldRefreshToken && oldRefreshToken !== token?.refreshToken && typeof token?.refreshToken === "string"
    ? await encode({ token, secret: env.AUTH_SECRET, salt: cookieName, maxAge: cookieMaxAge })
    : null;
  if (route.permission && (token?.authError || typeof token?.accessToken !== "string")) {
    return attachRotatedCookie(jsonError(401, "Your session has expired. Sign in again.", "Unauthorized"), rotatedCookie, request);
  }

  const url = new URL(request.url);
  const backendUrl = `${env.BACKEND_API_URL}/${path.map(encodeURIComponent).join("/")}${url.search}`;
  const headers = new Headers();
  for (const name of ["accept", "content-type", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const range = route.range && request.headers.get("range");
  if (range) headers.set("range", range);
  if (typeof token?.accessToken === "string") headers.set("authorization", `Bearer ${token.accessToken}`);
  headers.set("x-request-id", requestId);

  try {
    const body = request.body && !["GET", "HEAD"].includes(method) ? limitedBody(request.body, requestBodyLimit) : undefined;
    const upstream = await fetch(backendUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(route.timeoutMs ?? timeoutMs),
      ...(body ? { duplex: "half" as const } : {}),
    } as RequestInit & { duplex?: "half" });
    if (!upstream.ok && !(route.range && upstream.status === 416)) return attachRotatedCookie(await backendError(upstream), rotatedCookie, request);

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, name) => {
      if (!hopByHopHeaders.has(name.toLowerCase()) && !sensitiveResponseHeaders.has(name.toLowerCase())) responseHeaders.set(name, value);
    });
    responseHeaders.set("cache-control", "no-store");
    responseHeaders.set("x-request-id", requestId);
    const response = new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
    return attachRotatedCookie(response, rotatedCookie, request);
  } catch (error) {
    if (error instanceof RangeError || error instanceof Error && error.cause instanceof RangeError) return attachRotatedCookie(jsonError(413, "Request body is too large.", "PayloadTooLarge"), rotatedCookie, request);
    if (error instanceof DOMException && error.name === "TimeoutError") return attachRotatedCookie(jsonError(504, "The API request timed out.", "GatewayTimeout"), rotatedCookie, request);
    return attachRotatedCookie(jsonError(502, "The API is temporarily unavailable.", "BadGateway"), rotatedCookie, request);
  }
}

async function safeHandle(request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    return await handle(request, context);
  } catch {
    return jsonError(502, "The API is temporarily unavailable.", "BadGateway");
  }
}

export const GET = safeHandle;
export const POST = safeHandle;
export const PUT = safeHandle;
export const PATCH = safeHandle;
export const DELETE = safeHandle;
