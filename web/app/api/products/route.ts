import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) {
    return NextResponse.json({ message: "Product service is not configured" }, { status: 503 });
  }

  try {
    const response = await fetch(`${backend}/products`, { cache: "no-store" });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Product service is unavailable" }, { status: 502 });
  }
}
