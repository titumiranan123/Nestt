import { NextRequest, NextResponse } from "next/server";

const accessCookie = "nestt_customer_access";
const refreshCookie = "nestt_customer_refresh";
const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const maxBodyBytes = 8192;
const uuid = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";
const routes = [
  { method: "POST", path: /^login$/, upstream: "/auth/email/login", public: true, tokens: true },
  { method: "POST", path: /^email\/signup$/, upstream: "/auth/email/signup", public: true },
  { method: "POST", path: /^email\/verify$/, upstream: "/auth/email/verify", public: true },
  { method: "POST", path: /^email\/resend-verification$/, upstream: "/auth/email/resend-verification", public: true },
  { method: "POST", path: /^phone\/signup$/, upstream: "/auth/customer/phone/signup", public: true },
  { method: "POST", path: /^phone\/signup\/verify$/, upstream: "/auth/customer/phone/signup/verify", public: true, tokens: true },
  { method: "POST", path: /^phone\/login$/, upstream: "/auth/customer/phone/login", public: true, tokens: true },
  { method: "POST", path: /^phone\/request$/, upstream: "/auth/customer/phone/login/request-otp", public: true },
  { method: "POST", path: /^phone\/verify$/, upstream: "/auth/customer/phone/login/verify-otp", public: true, tokens: true },
  { method: "POST", path: /^phone\/forgot-password$/, upstream: "/auth/customer/phone/forgot-password", public: true },
  { method: "POST", path: /^phone\/reset-password$/, upstream: "/auth/customer/phone/reset-password", public: true },
  { method: "GET", path: /^checkout\/public\/delivery-areas$/, upstream: "/public-checkout/delivery-areas", public: true },
  { method: "POST", path: /^checkout\/public\/quote$/, upstream: "/public-checkout/quote", public: true },
  { method: "POST", path: /^checkout\/public\/otp$/, upstream: "/public-checkout/otp", public: true },
  { method: "POST", path: /^checkout\/public\/complete$/, upstream: "/public-checkout/complete", public: true, checkoutSession: true },
  { method: "GET", path: /^profile$/, upstream: "/auth/me" },
  { method: "PATCH", path: /^profile$/, upstream: "/auth/me" },
  { method: "POST", path: /^link\/phone\/(request|verify)$/, upstream: "/auth/link/phone/$1" },
  { method: "GET", path: /^delivery-areas$/, upstream: "/orders/delivery-areas" },
  { method: "GET", path: /^addresses$/, upstream: "/addresses" },
  { method: "POST", path: /^addresses$/, upstream: "/addresses" },
  { method: "PATCH", path: new RegExp(`^addresses/(${uuid})$`), upstream: "/addresses/$1" },
  { method: "DELETE", path: new RegExp(`^addresses/(${uuid})$`), upstream: "/addresses/$1" },
  { method: "GET", path: /^orders$/, upstream: "/orders" },
  { method: "POST", path: /^orders\/quote$/, upstream: "/orders/quote" },
  { method: "POST", path: /^orders\/otp$/, upstream: "/orders/otp" },
  { method: "POST", path: /^orders$/, upstream: "/orders", checkout: true },
  { method: "GET", path: new RegExp(`^orders/checkout/(${uuid})$`), upstream: "/orders/checkout/$1" },
  { method: "GET", path: new RegExp(`^orders/(${uuid})$`), upstream: "/orders/$1" },
  { method: "POST", path: new RegExp(`^orders/(${uuid})/payment(/check)?$`), upstream: "/orders/$1/payment$2" },
  { method: "GET", path: new RegExp(`^orders/(${uuid})/invoice$`), upstream: "/invoices/orders/$1/download", invoice: true },
  { method: "POST", path: new RegExp(`^orders/(${uuid})/(cancel|returns)$`), upstream: "/orders/$1/$2", noContent: true },
  { method: "GET", path: /^wishlist$/, upstream: "/wishlist" },
  { method: "PUT", path: new RegExp(`^wishlist/items/(${uuid})$`), upstream: "/wishlist/items/$1" },
  { method: "DELETE", path: new RegExp(`^wishlist/items/(${uuid})$`), upstream: "/wishlist/items/$1" },
];

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

function cookieOptions(request: NextRequest) {
  const host = request.nextUrl.hostname;
  const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: request.nextUrl.protocol === "https:" || (process.env.NODE_ENV === "production" && !local),
    path: "/api/account",
  };
}

function clearSession(request: NextRequest, response: NextResponse) {
  const options = { ...cookieOptions(request), maxAge: 0 };
  response.cookies.set(accessCookie, "", options);
  response.cookies.set(refreshCookie, "", options);
  return response;
}

function storeSession(
  request: NextRequest,
  tokens: { accessToken?: unknown; refreshToken?: unknown; expiresIn?: unknown },
  body: unknown = { success: true },
) {
  const { accessToken, refreshToken, expiresIn } = tokens;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string" ||
      typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn < 1) {
    return json({ message: "The account service returned an invalid session." }, 502);
  }
  const response = json(body);
  const options = cookieOptions(request);
  response.cookies.set(accessCookie, accessToken, { ...options, maxAge: Math.floor(expiresIn) });
  response.cookies.set(refreshCookie, refreshToken, { ...options, maxAge: 30 * 24 * 60 * 60 });
  return response;
}

function backendFetch(backend: string, path: string, method: string, body?: string, token?: string) {
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${backend}${path}`, {
    method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(10_000),
  });
}

async function readBody(request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes) return null;
  const reader = request.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return body + decoder.decode();
      size += value.byteLength;
      if (size > maxBodyBytes) {
        void reader.cancel().catch(() => undefined);
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function upstreamError(response: Response, linkVerification = false, serviceMessage?: string) {
  if (response.status >= 500 || response.status < 400) {
    const unavailable = response.status === 503;
    return json(
      { message: unavailable && serviceMessage ? serviceMessage : "The account service is temporarily unavailable." },
      unavailable ? 503 : 502,
    );
  }
  const body = await response.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message : "Could not complete this request.";
  const status = linkVerification && response.status === 401 && message === "Invalid or expired code"
    ? 400
    : response.status;
  return json({ message }, status);
}

async function sessionAction(request: NextRequest, backend: string, access?: string) {
  const refresh = request.cookies.get(refreshCookie)?.value;
  if (request.method === "DELETE") {
    if (refresh) {
      const response = await backendFetch(backend, "/auth/logout", "POST", JSON.stringify({ refreshToken: refresh }));
      if (!response.ok && response.status !== 401) return upstreamError(response);
    }
    return clearSession(request, json({ success: true }));
  }
  if (!refresh) return clearSession(request, json({ message: "Sign in to continue." }, 401));
  // A nearby request may have refreshed this session while this tab waited.
  if (access) {
    const current = await backendFetch(backend, "/auth/me", "GET", undefined, access);
    if (current.ok) return json({ success: true });
    if (current.status !== 401) return upstreamError(current);
  }
  const response = await backendFetch(backend, "/auth/token/refresh", "POST", JSON.stringify({ refreshToken: refresh }));
  if (response.status === 401) return clearSession(request, json({ message: "Sign in to continue." }, 401));
  if (!response.ok) return upstreamError(response);
  return storeSession(request, await response.json());
}

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const origin = `${request.nextUrl.protocol}//${host}`;
  if (request.method !== "GET" && request.headers.get("origin") !== origin) {
    return json({ message: "Request origin is not allowed." }, 403);
  }
  const { path } = await params;
  const routePath = path.join("/");
  const route = routes.find((item) => item.method === request.method && item.path.test(routePath));
  const session = routePath === "session" && ["POST", "DELETE"].includes(request.method);
  if (!route && !session) return json({ message: "Account endpoint not found." }, 404);

  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  const access = request.cookies.get(accessCookie)?.value;
  if (!backend) return json({ message: "The account service is unavailable." }, 503);
  try {
    if (session) return await sessionAction(request, backend, access);
    if (!route) return json({ message: "Account endpoint not found." }, 404);
    if (!route.public && !access) return json({ message: "Sign in to continue." }, 401);

    let body: string | undefined;
    if (["POST", "PATCH"].includes(request.method)) {
      if (!request.headers.get("content-type")?.startsWith("application/json")) {
        return json({ message: "Expected JSON." }, 415);
      }
      const payload = await readBody(request);
      if (payload === null) return json({ message: "Request is too large." }, 413);
      if (route.checkout || route.checkoutSession) {
        let checkout;
        try { checkout = JSON.parse(payload); }
        catch { return json({ message: "Expected a checkout request." }, 400); }
        if (typeof checkout.checkoutId !== "string" || typeof checkout.expectedTotal !== "number") {
          return json({ message: "Refresh your checkout total and try again." }, 400);
        }
        if (typeof checkout.contactEmail !== "string" || !checkout.contactEmail.trim()) {
          return json({ message: "Enter an email address for order updates." }, 400);
        }
      }
      body = payload;
    }

    const target = routePath.replace(route.path, route.upstream);
    const query = target === "/orders" && request.method === "GET" ? request.nextUrl.search : "";
    const response = await backendFetch(backend, target + query, request.method, body, route.public ? undefined : access);
    if (!response.ok) return await upstreamError(
      response,
      /^link\/.+\/verify$/.test(routePath),
      routePath.startsWith("phone/") ? "Phone verification is temporarily unavailable. Please try again shortly." : undefined,
    );
    if (route.checkout) {
      const { id } = await response.json();
      return json({ id }, response.status);
    }
    if (route.checkoutSession) {
      const result = await response.json();
      if (typeof result?.id !== "string" || typeof result?.orderCode !== "string") {
        return json({ message: "The checkout service returned an invalid order." }, 502);
      }
      return storeSession(request, result.session, { id: result.id, orderCode: result.orderCode });
    }
    if (route.tokens) return storeSession(request, await response.json());
    if (route.noContent || response.status === 204) {
      return new NextResponse(null, { status: 204, headers: privateHeaders });
    }
    if (route.invoice && response.headers.get("content-type")?.startsWith("application/pdf")) {
      return new NextResponse(response.body, {
        headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": "attachment" },
      });
    }
    if (route.invoice) return json({ message: "The invoice could not be downloaded." }, 502);
    return json(await response.json(), response.status);
  } catch {
    return json({ message: "The account service is temporarily unavailable." }, 502);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
