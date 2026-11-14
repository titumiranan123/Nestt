const fallbackRobots = "User-agent: *\nAllow: /\nDisallow: /admin/\n";

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return new Response(fallbackRobots, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  }
  try {
    const upstream = await fetch(`${backendUrl}/robots.txt`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!upstream.ok) throw new Error("Robots endpoint unavailable");
    return new Response(await upstream.text(), {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=300" },
    });
  } catch {
    return new Response(fallbackRobots, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=60" },
    });
  }
}
