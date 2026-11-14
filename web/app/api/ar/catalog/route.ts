import { NextResponse } from 'next/server';

export async function GET() {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, '');
  if (!backend) return NextResponse.json({ message: 'AR catalogue service is not configured.' }, { status: 503 });
  try {
    const upstream = await fetch(`${backend}/products/ar-catalog`, { cache: 'no-store' });
    return NextResponse.json(await upstream.json(), { status: upstream.status, headers: { 'Cache-Control': 'no-store' } });
  } catch { return NextResponse.json({ message: 'Could not reach the AR catalogue service.' }, { status: 502 }); }
}
