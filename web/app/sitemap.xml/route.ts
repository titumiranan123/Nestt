const xmlHeaders = { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300" };

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return new Response("Sitemap is temporarily unavailable.", {
      status: 503,
      headers: { ...xmlHeaders, "retry-after": "60" },
    });
  }
  try {
    const upstream = await fetch(`${backendUrl}/sitemap.xml`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) throw new Error("Sitemap endpoint unavailable");
    const content = await upstream.text();
    if (!content.includes("<urlset") || !content.includes("<loc>")) {
      return new Response("Sitemap is not configured.", {
        status: 503,
        headers: { ...xmlHeaders, "retry-after": "60" },
      });
    }
    return new Response(content, { headers: xmlHeaders });
  } catch {
    return new Response("Sitemap is temporarily unavailable.", {
      status: 503,
      headers: { ...xmlHeaders, "retry-after": "60" },
    });
  }
}
