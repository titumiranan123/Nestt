import { NextResponse } from "next/server";
import { fetchPublicCategories } from "@/lib/public-categories";

export async function GET() {
  try {
    const response = await fetchPublicCategories();
    if (!response) return NextResponse.json({ message: "Category service is not configured" }, { status: 503 });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Category service is unavailable" }, { status: 502 });
  }
}
