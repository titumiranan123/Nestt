"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Minus, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import AdminDrawer from "@/components/admin/AdminDrawer";
import { productsApi } from "@/features/products/api";
import type { Product, ProductVariant } from "@/features/products/types";
import { ordersApi } from "@/features/orders/api";
import type { OrderRecord } from "@/features/orders/types";
import { getErrorMessage } from "@/lib/api/errors";

const money = (value: number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value);
const field = "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";
const label = "mb-1.5 block text-xs font-semibold text-gray-700";

export function OrderCreateDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (order: OrderRecord) => void }) {
  const products = useQuery({ queryKey: ["admin", "products", "pos"], queryFn: productsApi.list, enabled: open });
  const areas = useQuery({ queryKey: ["admin", "orders", "delivery-areas"], queryFn: ordersApi.deliveryAreas, enabled: open });
  const create = useMutation({ mutationFn: ordersApi.create });
  const [search, setSearch] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [shippingThanaId, setShippingThanaId] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CASH_ON_DELIVERY" | "SSL_COMMERZ" | "BANK_TRANSFER">("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"UNPAID" | "PENDING" | "PAID">("PAID");
  const [paymentReference, setPaymentReference] = useState("");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");

  const productList = products.data ?? [];
  const variantIndex = useMemo(() => new Map(productList.flatMap((product) => product.variants.map((variant) => [variant.id, { product, variant }] as const))), [productList]);
  const visibleProducts = productList.filter((product) => product.status === "active" && product.name.toLowerCase().includes(search.trim().toLowerCase()) && product.variants.some((variant) => variant.status === "active" && variant.stockQty > 0));
  const deliveryAreas = (areas.data ?? []).flatMap((division) => division.districts.flatMap((district) => district.thanas.filter((thana) => thana.isDeliverable).map((thana) => ({ ...thana, division: division.name, district: district.name }))));
  const selectedArea = deliveryAreas.find((area) => area.id === shippingThanaId);
  const cartItems = Object.entries(cart).map(([variantId, quantity]) => {
    const item = variantIndex.get(variantId);
    return item ? { ...item, quantity } : null;
  }).filter((item): item is { product: Product; variant: ProductVariant; quantity: number } => Boolean(item));
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);
  const discountAmount = Number(discount) || 0;
  const itemClass = "rounded-xl border border-gray-200 bg-white p-3";

  const addVariant = (variantId: string) => setCart((current) => ({ ...current, [variantId]: Math.min(99, (current[variantId] ?? 0) + 1) }));
  const setQuantity = (variantId: string, quantity: number) => setCart((current) => {
    const next = { ...current };
    if (quantity <= 0) delete next[variantId];
    else next[variantId] = quantity;
    return next;
  });
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cartItems.length || (fulfillmentType === "DELIVERY" && !selectedArea) || discountAmount > subtotal) return;
    try {
      const order = await create.mutateAsync({
        items: cartItems.map(({ variant, quantity }) => ({ variantId: variant.id, quantity })),
        customerName,
        phone,
        emergencyContactPhone: emergencyContactPhone.trim() || null,
        email: email.trim() || null,
        fulfillmentType,
        shippingThanaId: fulfillmentType === "DELIVERY" ? shippingThanaId : null,
        shippingAddress: fulfillmentType === "DELIVERY" ? shippingAddress : "Store pickup",
        shippingPostalCode: shippingPostalCode.trim() || null,
        paymentMethod,
        paymentStatus,
        paymentReference: paymentReference.trim() || null,
        discountAmount,
        source: "POS",
        notes: notes.trim() || null,
      });
      onCreated(order);
    } catch {
      // Keep the drawer open so the operator can correct the fields and retry.
    }
  };

  return <AdminDrawer open={open} onClose={onClose} title="Create order" description="Add products to the cart, enter delivery and contact details, then save a POS order." widthClassName="max-w-6xl">
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
      <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
        <section className="flex min-h-0 flex-col border-b border-gray-200 xl:border-b-0 xl:border-r">
          <div className="border-b border-gray-100 p-4 sm:p-5"><label className={label} htmlFor="pos-search">Product catalog</label><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input id="pos-search" className={`${field} pl-9`} placeholder="Search products" value={search} onChange={(event) => setSearch(event.target.value)}/></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {products.isPending ? <div role="status" className="space-y-3"><span className="sr-only">Loading products</span>{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />)}</div> : products.isError ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Could not load products: {getErrorMessage(products.error)}</p> : !visibleProducts.length ? <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No active products with stock found.</p> : <div className="grid gap-3 sm:grid-cols-2">{visibleProducts.map((product) => {
              const variants = product.variants.filter((variant) => variant.status === "active" && variant.stockQty > 0);
              const variantId = selectedVariants[product.id] ?? variants[0].id;
              const variant = variants.find((item) => item.id === variantId) ?? variants[0];
              return <article key={product.id} className={itemClass}><strong className="block truncate text-sm font-semibold text-gray-900">{product.name}</strong><p className="mt-1 truncate text-xs text-gray-500">{variant.name} · {variant.sku}</p><div className="mt-3 flex items-center gap-2"><select aria-label={`Variant for ${product.name}`} className={`${field} min-w-0 flex-1`} value={variant.id} onChange={(event) => setSelectedVariants((current) => ({ ...current, [product.id]: event.target.value }))}>{variants.map((item) => <option value={item.id} key={item.id}>{item.name} · {money(Number(item.price))}</option>)}</select><button type="button" onClick={() => addVariant(variant.id)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white hover:bg-brand-dark"><Plus size={15}/>Add</button></div><small className="mt-2 block text-[10px] text-gray-400">{money(Number(variant.price))} · {variant.stockQty} in stock</small></article>;
            })}</div>}
          </div>
        </section>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          <section aria-label="Order cart"><div className="flex items-center gap-2 text-sm font-bold text-gray-900"><ShoppingBag size={17} className="text-brand"/>Cart <span className="text-xs font-medium text-gray-400">({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span></div>
            <div className="mt-3 space-y-2">{cartItems.length ? cartItems.map(({ product, variant, quantity }) => <div key={variant.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3"><div className="min-w-0 flex-1"><strong className="block truncate text-xs font-semibold text-gray-800">{product.name}</strong><small className="text-[10px] text-gray-500">{variant.name} · {money(Number(variant.price))}</small></div><div className="flex items-center gap-1"><button type="button" aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(variant.id, quantity - 1)} className="grid size-7 place-items-center rounded border border-gray-200"><Minus size={12}/></button><span className="w-6 text-center text-xs font-bold">{quantity}</span><button type="button" aria-label={`Increase ${product.name}`} onClick={() => setQuantity(variant.id, Math.min(variant.stockQty, quantity + 1))} disabled={quantity >= variant.stockQty} className="grid size-7 place-items-center rounded border border-gray-200 disabled:opacity-40"><Plus size={12}/></button><button type="button" aria-label={`Remove ${product.name}`} onClick={() => setQuantity(variant.id, 0)} className="ml-1 grid size-7 place-items-center rounded text-red-600 hover:bg-red-50"><Trash2 size={13}/></button></div><strong className="w-20 text-right text-xs">{money(Number(variant.price) * quantity)}</strong></div>) : <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">Add a product to begin this order.</p>}</div>
          </section>

          <section className="mt-5 space-y-3 border-t border-gray-100 pt-4"><h3 className="text-sm font-bold text-gray-900">Customer and fulfillment</h3>
            <div className="grid gap-3 sm:grid-cols-2"><label><span className={label}>Customer name *</span><input required maxLength={100} className={field} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer name"/></label><label><span className={label}>Phone number *</span><input required type="tel" maxLength={20} className={field} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+8801…"/></label><label><span className={label}>Emergency contact number</span><input type="tel" maxLength={20} className={field} value={emergencyContactPhone} onChange={(event) => setEmergencyContactPhone(event.target.value)} placeholder="Optional alternate number"/></label><label><span className={label}>Email (optional)</span><input type="email" maxLength={255} className={field} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com"/></label></div>
            <label className="block"><span className={label}>Fulfillment</span><select className={field} value={fulfillmentType} onChange={(event) => setFulfillmentType(event.target.value as typeof fulfillmentType)}><option value="DELIVERY">Delivery</option><option value="PICKUP">Store pickup</option></select></label>
            {fulfillmentType === "DELIVERY" && <><label className="block"><span className={label}>Delivery area *</span><select required className={field} value={shippingThanaId} onChange={(event) => setShippingThanaId(event.target.value)}><option value="">Select a delivery area</option>{deliveryAreas.map((area) => <option key={area.id} value={area.id}>{area.name}, {area.district}, {area.division}</option>)}</select>{areas.isLoading && <small className="mt-1 block text-gray-400">Loading delivery areas…</small>}{areas.isError && <small role="alert" className="mt-1 block text-red-600">Could not load delivery areas: {getErrorMessage(areas.error)}</small>}{!areas.isLoading && !areas.isError && deliveryAreas.length === 0 && <small className="mt-1 block text-amber-700">No delivery areas are configured. Choose store pickup or add an area in delivery settings.</small>}</label>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]"><label><span className={label}>Delivery address *</span><input required maxLength={500} className={field} value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="House, road, area"/></label><label><span className={label}>Postal code</span><input maxLength={20} className={field} value={shippingPostalCode} onChange={(event) => setShippingPostalCode(event.target.value)} placeholder="Optional"/></label></div></>}
          </section>

          <section className="mt-5 space-y-3 border-t border-gray-100 pt-4"><h3 className="text-sm font-bold text-gray-900">Payment and notes</h3><div className="grid gap-3 sm:grid-cols-2"><label><span className={label}>Payment method</span><select className={field} value={paymentMethod} onChange={(event) => { const value = event.target.value as typeof paymentMethod; setPaymentMethod(value); setPaymentStatus(value === "CASH" ? "PAID" : value === "SSL_COMMERZ" ? "PENDING" : "UNPAID"); }}><option value="CASH">Cash received</option><option value="CASH_ON_DELIVERY">Cash on delivery</option><option value="BANK_TRANSFER">Bank transfer</option><option value="SSL_COMMERZ">SSLCommerz</option></select></label><label><span className={label}>Payment status</span><select className={field} value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as typeof paymentStatus)}><option value="PAID">Paid</option><option value="UNPAID">Unpaid</option><option value="PENDING">Pending</option></select></label></div><div className="grid gap-3 sm:grid-cols-2"><label><span className={label}>Discount (৳)</span><input type="number" min="0" step="0.01" max={subtotal} className={field} value={discount} onChange={(event) => setDiscount(event.target.value)}/></label><label><span className={label}>Payment reference</span><input maxLength={255} className={field} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder="Optional transaction ID"/></label></div><label className="block"><span className={label}>Order note</span><textarea maxLength={2000} rows={2} className="w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional note for the order"/></label></section>
          <section className="mt-5 space-y-2 rounded-xl bg-gray-50 p-4 text-sm"><div className="flex justify-between text-gray-600"><span>Items subtotal</span><span>{money(subtotal)}</span></div><div className="flex justify-between text-gray-600"><span>{fulfillmentType === "PICKUP" ? "Fulfillment" : "Delivery"}</span><span>{fulfillmentType === "PICKUP" ? "Store pickup · Free" : selectedArea?.shippingFee ? money(Number(selectedArea.shippingFee)) : "Calculated on save"}</span></div><div className="flex justify-between text-gray-600"><span>Discount</span><span>−{money(discountAmount)}</span></div><div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-950"><span>Total before final delivery adjustment</span><span>{money(Math.max(0, subtotal - discountAmount + Number(fulfillmentType === "DELIVERY" ? selectedArea?.shippingFee ?? 0 : 0)))}</span></div></section>
          {create.isError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Order could not be created: {getErrorMessage(create.error)}</p>}
          {discountAmount > subtotal && <p role="alert" className="mt-3 text-xs text-red-600">Discount cannot exceed item subtotal.</p>}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-4 sm:px-6"><p className="text-xs text-gray-500">Stock is reserved when the order is saved.</p><div className="flex gap-2"><button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700">Cancel</button><button type="submit" disabled={create.isPending || !cartItems.length || (fulfillmentType === "DELIVERY" && !shippingThanaId) || discountAmount > subtotal || products.isError || areas.isError} className="h-10 rounded-lg bg-accent px-4 text-sm font-bold text-white disabled:opacity-50">{create.isPending ? "Saving order…" : `Create order · ${money(subtotal - discountAmount + (fulfillmentType === "PICKUP" ? 0 : Number(selectedArea?.shippingFee ?? 0)))}`}</button></div></footer>
    </form>
  </AdminDrawer>;
}
