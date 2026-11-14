import "server-only";

function requiredHttpUrl(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is required.`);
  let parsed: URL;
  try { parsed = new URL(value); } catch { throw new Error(`${name} must be a valid HTTP(S) URL.`); }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} must use HTTP or HTTPS.`);
  }
  return value.replace(/\/+$/, "");
}

const authSecret = process.env.AUTH_SECRET;
if (!authSecret || authSecret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");

const rawAuthUrl = process.env.AUTH_URL;
const authUrl = rawAuthUrl ? requiredHttpUrl("AUTH_URL", rawAuthUrl) : undefined;
if (process.env.NODE_ENV === "production" && !authUrl) {
  throw new Error("AUTH_URL must be set in production so cookie security and CSRF origins are deterministic.");
}
if (process.env.NODE_ENV === "production" && authUrl && !authUrl.startsWith("https://")) {
  throw new Error("AUTH_URL must use HTTPS in production.");
}
const rawTrustHost = process.env.AUTH_TRUST_HOST ?? "true";
if (rawTrustHost !== "true" && rawTrustHost !== "false") {
  throw new Error('AUTH_TRUST_HOST must be either "true" or "false".');
}

export const env = {
  BACKEND_API_URL: requiredHttpUrl("BACKEND_API_URL", process.env.BACKEND_API_URL),
  AUTH_SECRET: authSecret,
  AUTH_URL: authUrl,
  AUTH_TRUST_HOST: rawTrustHost === "true",
};

export const isSecureCookie = process.env.NODE_ENV === "production" || (env.AUTH_URL?.startsWith("https://") ?? false);
