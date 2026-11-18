"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { defaultVariant, purchaseLimit, variantImage, type CatalogProduct } from "@/lib/catalog";
import { money } from "@/lib/account/data";
import { useCartCatalog } from "./useCartCatalog";

export type VariantCartItem = { variantId: string; quantity: number };
type StoredCartItem = VariantCartItem | { productId: string; quantity: number };

export function cartKey(item: StoredCartItem) {
  return "variantId" in item ? item.variantId : item.productId;
}

type CartContextValue = {
  items: StoredCartItem[];
  ready: boolean;
  count: number;
  addItem: (variantId: string, quantity: number, stockLimit: number) => void;
  addItems: (items: (VariantCartItem & { stockLimit: number })[]) => void;
  migrateItems: (products: CatalogProduct[]) => void;
  removeOrderedItems: (items: VariantCartItem[]) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  openCart: () => void;
};

const STORAGE_KEY = "nestt-cart";
const CartContext = createContext<CartContextValue | null>(null);

function readCart(): StoredCartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): StoredCartItem[] => {
      if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1) return [];
      if (typeof item.variantId === "string") return [{ variantId: item.variantId, quantity: item.quantity }];
      if (typeof item.productId === "string") return [{ productId: item.productId, quantity: item.quantity }];
      return [];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setItems(readCart());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const commit = useCallback((next: StoredCartItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setItems(next);
  }, []);
  const addItems = useCallback((entries: (VariantCartItem & { stockLimit: number })[]) => {
    if (!entries.length) return;
    const next = new Map(readCart().map((item) => [cartKey(item), item]));
    for (const { variantId, quantity, stockLimit } of entries) {
      const total = (next.get(variantId)?.quantity ?? 0) + quantity;
      if (!Number.isInteger(quantity) || quantity < 1 || total > Math.min(99, stockLimit)) {
        throw new Error("This quantity isn’t available for the selected option.");
      }
      next.set(variantId, { variantId, quantity: total });
    }
    commit([...next.values()]);
    setOpen(true);
  }, [commit]);
  const addItem = useCallback((variantId: string, quantity: number, stockLimit: number) => {
    addItems([{ variantId, quantity, stockLimit }]);
  }, [addItems]);
  const migrateItems = useCallback((products: CatalogProduct[]) => {
    const current = readCart();
    if (current.every((item) => "variantId" in item)) return;
    const next = new Map<string, StoredCartItem>();
    for (const item of current) {
      const product = "productId" in item ? products.find((entry) => entry.id === item.productId) : undefined;
      const variant = product && defaultVariant(product);
      const migrated = variant ? { variantId: variant.id, quantity: item.quantity } : item;
      const key = cartKey(migrated);
      next.set(key, { ...migrated, quantity: migrated.quantity + (next.get(key)?.quantity ?? 0) });
    }
    if (JSON.stringify([...next.values()]) !== JSON.stringify(current)) commit([...next.values()]);
  }, [commit]);
  const setQuantity = useCallback((id: string, quantity: number) => {
    const items = readCart();
    commit(quantity < 1 ? items.filter((item) => cartKey(item) !== id) : items.map((item) => cartKey(item) === id ? { ...item, quantity } : item));
  }, [commit]);
  const removeItem = useCallback((id: string) => setQuantity(id, 0), [setQuantity]);
  const removeOrderedItems = useCallback((ordered: VariantCartItem[]) => {
    const quantities = new Map(ordered.map((item) => [item.variantId, item.quantity]));
    commit(readCart().map((item) => ({ ...item, quantity: item.quantity - (quantities.get(cartKey(item)) ?? 0) })).filter((item) => item.quantity > 0));
  }, [commit]);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ items, ready, count: items.reduce((sum, item) => sum + item.quantity, 0), addItem, addItems, migrateItems, removeOrderedItems, setQuantity, removeItem, openCart }), [items, ready, addItem, addItems, migrateItems, removeOrderedItems, setQuantity, removeItem, openCart]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {open && <CartDrawer items={items} onClose={closeCart} onQuantity={setQuantity} onRemove={removeItem} />}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

function CartDrawer({ items, onClose, onQuantity, onRemove }: {
  items: StoredCartItem[];
  onClose: () => void;
  onQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const { rows, loading, loadError } = useCartCatalog();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  const subtotal = rows.reduce((sum, { item, variant }) => sum + (variant ? Number(variant.price) * item.quantity : 0), 0);

  return (
    <div className="fixed inset-0 z-[100]" role="presentation">
      <button aria-label="Close cart" onClick={onClose} className="absolute inset-0 cursor-pointer bg-black/35" />
      <aside role="dialog" aria-modal="true" aria-label="Your cart" className="cart-drawer absolute inset-y-0 right-0 flex w-full max-w-[390px] flex-col bg-white shadow-2xl">
        <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#eee] px-5">
          <h2 className="text-[15px] font-semibold text-[#222]">Your Cart <span className="font-normal text-[#888]">({items.reduce((n, i) => n + i.quantity, 0)})</span></h2>
          <button onClick={onClose} aria-label="Close cart" className="flex size-8 cursor-pointer items-center justify-center text-[22px] text-[#777] hover:text-black">×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {loading ? <p className="py-10 text-center text-sm text-[#777]">Loading your cart…</p> : loadError ? <p className="py-10 text-center text-sm text-[#777]">Couldn’t load products. Please try again.</p> : !items.length ? <div className="py-16 text-center"><p className="text-sm text-[#555]">Your cart is empty.</p><button onClick={onClose} className="mt-4 cursor-pointer text-xs font-semibold text-[#f15a22] underline">Continue shopping</button></div> : (
            <div className="divide-y divide-[#eee]">
              {rows.map(({ item, product, variant }) => {
                const id = cartKey(item);
                const image = variantImage(variant);
                const limit = product ? purchaseLimit(product, variant) : 0;
                return product && variant ? (
                <article key={id} className="flex gap-3 py-4">
                  <div className="relative size-[78px] shrink-0 overflow-hidden bg-[#f5f3ef]">
                    {image && <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2"><Link href={`/products/${product.slug}`} onClick={onClose} className="line-clamp-2 text-[12px] font-medium leading-4 text-[#292929]">{product.name}</Link><button onClick={() => onRemove(id)} aria-label={`Remove ${product.name} — ${variant.name}`} className="cursor-pointer text-[17px] leading-none text-[#999] hover:text-[#e55326]">×</button></div>
                    <p className="mt-1 text-[10px] text-[#777]">{variant.name}</p>
                    {item.quantity > limit && <p className="mt-1 text-[11px] text-[#a04433]">{limit ? `Only ${limit} available` : "Currently unavailable"}</p>}
                    <div className="mt-3 flex items-center justify-between"><div className="flex h-7 items-center border border-[#e6e6e6] text-[11px]"><button aria-label="Decrease quantity" onClick={() => onQuantity(id, item.quantity - 1)} className="size-7 cursor-pointer text-[#777]">−</button><span className="min-w-7 text-center">{item.quantity}</span><button aria-label="Increase quantity" disabled={item.quantity >= limit} onClick={() => onQuantity(id, item.quantity + 1)} className="size-7 cursor-pointer text-[#777] disabled:opacity-40">+</button></div><strong className="text-[12px] font-semibold">{money(Number(variant.price) * item.quantity)}</strong></div>
                  </div>
                </article>
              ) : <div key={id} className="flex items-center justify-between py-4 text-xs text-[#777]"><span>This product is no longer available.</span><button onClick={() => onRemove(id)} className="cursor-pointer text-[#e55326]">Remove</button></div>;
              })}
            </div>
          )}
        </div>
        {items.length > 0 && !loading && !loadError && <footer className="shrink-0 border-t border-[#eee] px-5 pb-5 pt-4">
          <div className="flex items-center justify-between text-[13px]"><span className="font-medium">Order Summary</span><strong>{money(subtotal)}</strong></div>
          <p className="mt-2 text-[10px] leading-4 text-[#777]">Shipping and taxes calculated at checkout.</p>
          <Link href="/checkout" onClick={onClose} className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center bg-[#f15a22] text-[12px] font-semibold tracking-wide text-white hover:bg-[#d94b17]">Proceed to Checkout</Link>
          <button onClick={onClose} className="mt-3 w-full cursor-pointer text-[11px] text-[#555] underline underline-offset-2">Continue shopping</button>
        </footer>}
      </aside>
    </div>
  );
}
