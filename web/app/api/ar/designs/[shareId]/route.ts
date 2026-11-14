import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ shareId: string }> };

async function forward(request: Request, ctx: RouteContext, method: 'GET' | 'PATCH' | 'DELETE') {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, '');
  if (!backend) return NextResponse.json({ message: 'AR design service is not configured.' }, { status: 503 });
  const { shareId } = await ctx.params;
  const headers = new Headers();
  for (const name of ['authorization', 'x-design-edit-token', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(`${backend}/ar/designs/${encodeURIComponent(shareId)}`, {
      method, headers, cache: 'no-store',
      ...(method === 'PATCH' ? { body: JSON.stringify(await request.json()) } : {}),
    });
    const body = await upstream.json().catch(() => ({}));
    return NextResponse.json(body, { status: upstream.status });
  } catch { return NextResponse.json({ message: 'Could not reach the AR design service.' }, { status: 502 }); }
}

export async function GET(request: Request, ctx: RouteContext) {
  const backend = process.env.BACKEND_API_URL?.replace(/\/+$/, '');
  if (!backend) return NextResponse.json({ message: 'AR design service is not configured.' }, { status: 503 });
  const { shareId } = await ctx.params;
  try {
    const upstream = await fetch(`${backend}/ar/designs/share/${encodeURIComponent(shareId)}`, { cache: 'no-store' });
    return NextResponse.json(await upstream.json().catch(() => ({})), { status: upstream.status });
  } catch { return NextResponse.json({ message: 'Could not reach the AR design service.' }, { status: 502 }); }
}

export async function PATCH(request: Request, ctx: RouteContext) { return forward(request, ctx, 'PATCH'); }
export async function DELETE(request: Request, ctx: RouteContext) { return forward(request, ctx, 'DELETE'); }
