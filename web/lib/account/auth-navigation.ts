const fallback = "/account";
const internalOrigin = "https://nestt.local";

export function safeAccountReturn(value?: string | null) {
  if (!value || value.length > 1024 || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  try {
    const url = new URL(value, internalOrigin);
    const permitted = /^\/account(?:\/(?:profile|wishlist|addresses|orders(?:\/[\da-f-]{36})?))?$/i.test(url.pathname)
      || /^\/checkout\/(?:success|failed|cancelled|pending)\/[\da-f-]{36}$/i.test(url.pathname)
      || ["/checkout", "/products"].includes(url.pathname);
    return url.origin === internalOrigin && permitted ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}

export function authHref(path: string, returnTo?: string | null) {
  const destination = safeAccountReturn(returnTo);
  return destination === fallback ? path : `${path}?next=${encodeURIComponent(destination)}`;
}
