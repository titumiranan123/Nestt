import { NextResponse } from 'next/server';

export function GET() {
  const packageName = process.env.ANDROID_APP_ID;
  const fingerprints = (process.env.ANDROID_APP_SHA256_CERT_FINGERPRINTS ?? '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!packageName || fingerprints.length === 0) return NextResponse.json({ message: 'Android App Links are not configured.' }, { status: 503 });
  return NextResponse.json([{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: packageName, sha256_cert_fingerprints: fingerprints } }], { headers: { 'Cache-Control': 'public, max-age=300' } });
}
