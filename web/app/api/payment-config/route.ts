import { NextResponse } from "next/server";

export async function GET() {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, "");
  if (!backend) return NextResponse.json({ sslCommerzEnabled: false });

  try {
    const response = await fetch(`${backend}/payments/config`, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ sslCommerzEnabled: false });
    const config = await response.json();
    return NextResponse.json({ sslCommerzEnabled: config?.sslCommerzEnabled === true });
  } catch {
    return NextResponse.json({ sslCommerzEnabled: false });
  }
}
