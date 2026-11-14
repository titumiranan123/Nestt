import * as Keychain from 'react-native-keychain';
import { API_BASE_URL } from '../config';
import type { ARProduct } from '../catalog/ar-products';

type Session = { accessToken: string; refreshToken: string; expiresIn?: number; user?: { id: string; name: string; email?: string | null } };
let accessToken: string | null = null;

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try { response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, { ...init, headers }); }
  catch { throw new Error(`Nestt API is unreachable at ${API_BASE_URL}. Set the API host in src/config.ts.`); }
  if (response.status === 401 && retry && path !== '/auth/token/refresh') {
    const session = await Keychain.getGenericPassword({ service: 'com.nestt.roomar.session' });
    if (session) {
      const refreshed = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/token/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: session.password }),
      });
      if (refreshed.ok) {
        const tokens = await refreshed.json() as Omit<Session, 'user'>;
        accessToken = tokens.accessToken;
        await Keychain.setGenericPassword('refresh', tokens.refreshToken, { service: 'com.nestt.roomar.session', accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
        return request<T>(path, init, false);
      }
      await signOut();
    }
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join('\n') : body?.message;
    throw new Error(message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function restoreSession(): Promise<Session | null> {
  const saved = await Keychain.getGenericPassword({ service: 'com.nestt.roomar.session' });
  if (!saved) return null;
  try {
    const tokens = await request<Omit<Session, 'user'>>('/auth/token/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: saved.password }) }, false);
    accessToken = tokens.accessToken;
    await Keychain.setGenericPassword('refresh', tokens.refreshToken, { service: 'com.nestt.roomar.session', accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    const user = await request<Session['user']>('/auth/me');
    return { ...tokens, user: user ?? undefined };
  } catch { await signOut(); return null; }
}

export async function signIn(email: string, password: string): Promise<Session> {
  const session = await request<Session>('/auth/email/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
  accessToken = session.accessToken;
  await Keychain.setGenericPassword('refresh', session.refreshToken, { service: 'com.nestt.roomar.session', accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return session;
}

export async function signUp(email: string, password: string) {
  return request<{ message: string }>('/auth/email/signup', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
}

export async function verifyEmail(email: string, code: string, password: string) {
  return request<{ user: Session['user'] }>('/auth/email/verify', { method: 'POST', body: JSON.stringify({ email, code, password }) }, false);
}

export async function signOut() {
  const saved = await Keychain.getGenericPassword({ service: 'com.nestt.roomar.session' });
  if (saved) await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: saved.password }) }).catch(() => undefined);
  accessToken = null;
  await Keychain.resetGenericPassword({ service: 'com.nestt.roomar.session' });
}

export type ARDesignRoom = { width: number; length: number; items: Array<{ id: string; productVariantId?: string; slug?: string; name?: string; x: number; y: number; z: number; rotation: number }> };
export type SavedARDesign = { id?: string; shareId?: string; title: string; room: ARDesignRoom; shareEnabled?: boolean; editToken?: string; createdAt?: string; updatedAt?: string };

export const fetchARCatalog = () => request<Array<{
  variantId: string; slug: string; sku: string; name: string; variantName: string; category: string; categorySlug: string;
  price: string; inStock: boolean; image: string | null; modelUrl: string;
  dimensionsMm: [number, number, number]; placement: 'floor' | 'wall';
}>>('/products/ar-catalog', {}, false);

export function mapCatalogToARProducts(rows: Awaited<ReturnType<typeof fetchARCatalog>>): ARProduct[] {
  return rows.map((row) => ({
    id: row.variantId, variantId: row.variantId, sku: row.sku, slug: row.slug,
    name: row.name, category: row.category, categorySlug: row.categorySlug, description: row.variantName,
    dimensionsMm: row.dimensionsMm, placement: row.placement, floorOffsetMeters: 0, modelUrl: row.modelUrl, source: { uri: row.modelUrl },
    scale: [1, 1, 1], color: '#d8cec0', glyph: '▰', price: row.price, inStock: row.inStock,
    image: row.image ?? undefined,
  }));
}

export const addCartItem = (variantId: string, quantity = 1) => request('/cart/items', { method: 'POST', body: JSON.stringify({ variantId, quantity }) });
export const getCart = () => request<Array<{ quantity: number; variant: { id: string; sku: string; name: string; price: string; stockQuantity: number; product: { name: string } } }>>('/cart');
export const updateCartItem = (variantId: string, quantity: number) => request(`/cart/items/${variantId}`, { method: 'PATCH', body: JSON.stringify({ quantity }) });
export const removeCartItem = (variantId: string) => request(`/cart/items/${variantId}`, { method: 'DELETE' });
export const placeOrder = (items: Array<{ variantId: string; quantity: number }>, shippingAddress: { name: string; phone: string; region: string; city: string; area: string; address: string; postalCode?: string }) => request<{ id: string; orderCode: string }>('/orders', { method: 'POST', body: JSON.stringify({ items, shippingAddress, billingSameAsShipping: true }) });
export const saveARDesign = (title: string, room: ARDesignRoom) => request<SavedARDesign>('/ar/designs', { method: 'POST', body: JSON.stringify({ title, room }) });
export const updateARDesign = (id: string, editToken: string, title: string, room: ARDesignRoom) => request<SavedARDesign>(`/ar/designs/${id}`, { method: 'PATCH', headers: { 'X-Design-Edit-Token': editToken }, body: JSON.stringify({ title, room }) });
export const listMyDesigns = () => request<SavedARDesign[]>('/ar/designs/mine');
export const getSharedDesign = (shareId: string) => request<SavedARDesign>(`/ar/designs/share/${encodeURIComponent(shareId)}`, {}, false);
