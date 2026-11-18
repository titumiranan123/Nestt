import { NextRequest, NextResponse } from "next/server";

const kinds = new Set(["success", "failed", "cancelled", "ipn"]);
const outcomes = new Set(["success", "failed", "cancelled", "pending"]);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

async function callback(request: NextRequest, { params }: RouteContext<"/api/payments/sslcommerz/[kind]">) {
  const { kind } = await params;
  const order = request.nextUrl.searchParams.get("order") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  if (!kinds.has(kind) || !uuid.test(order) || !/^[a-f0-9]{64}$/.test(state)) {
    return NextResponse.json({ message: "Invalid payment callback." }, { status: 400, headers });
  }
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) return NextResponse.json({ message: "Payment service unavailable." }, { status: 503, headers });

  try {
    const reader = request.body?.getReader();
    let payload = new Uint8Array(0);
    if (reader) {
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > 8192) {
          void reader.cancel().catch(() => undefined);
          return new NextResponse(null, { status: 413, headers });
        }
        chunks.push(chunk.value);
      }
      payload = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { payload.set(chunk, offset); offset += chunk.byteLength; }
    }
    const fields = new URLSearchParams(new TextDecoder().decode(payload));
    const body = Object.fromEntries(
      ["tran_id", "val_id", "status"].map((key) => [key, fields.get(key) ?? request.nextUrl.searchParams.get(key)]),
    );
    const query = new URLSearchParams({ order, state });
    const response = await fetch(`${backend}/payments/sslcommerz/${kind}?${query}`, {
      method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
    });
    if (response.status === 400 || response.status === 404) return new NextResponse(null, { status: response.status, headers });
    if (!response.ok) throw new Error("Payment validation unavailable");
    const result = await response.json() as { id: string; outcome: string };
    if (result.id !== order || !outcomes.has(result.outcome)) throw new Error("Invalid payment status");
    if (kind === "ipn") return NextResponse.json({ accepted: true }, { headers });
    return new NextResponse(null, { status: 303, headers: { ...headers, Location: `/checkout/${result.outcome}/${order}` } });
  } catch {
    if (kind === "ipn") return new NextResponse(null, { status: 503, headers });
    return new NextResponse(null, { status: 303, headers: { ...headers, Location: `/checkout/pending/${order}` } });
  }
}

export const POST = callback;
export const GET = callback;
