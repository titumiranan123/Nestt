import "server-only";

export function fetchPublicCategories() {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) return null;

  return fetch(`${backend}/categories`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4_000),
  });
}
