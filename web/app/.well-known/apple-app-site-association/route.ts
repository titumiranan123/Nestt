import { NextResponse } from 'next/server';

export function GET() {
  const appId = process.env.IOS_APP_ID;
  if (!appId) return NextResponse.json({ message: 'iOS Universal Links are not configured.' }, { status: 503 });
  return NextResponse.json({ applinks: { apps: [], details: [{ appID: appId, paths: ['/ar/*', '/room-planner*'] }] } }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
