import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, '');
  if (!backend) return NextResponse.json({ message: 'AR design service is not configured.' }, { status: 503 });
  try {
    const upstream = await fetch(`${backend}/ar/designs`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...(request.headers.get('authorization') ? { Authorization: request.headers.get('authorization')! } : {}) },
      body: JSON.stringify(await request.json()),
    });
    return NextResponse.json(await upstream.json(), { status: upstream.status });
  } catch { return NextResponse.json({ message: 'Could not reach the AR design service.' }, { status: 502 }); }
}
