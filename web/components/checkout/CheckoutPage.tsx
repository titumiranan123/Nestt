"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cartKey, useCart, type VariantCartItem } from "@/components/cart/CartProvider";
import { useCartCatalog } from "@/components/cart/useCartCatalog";
import { AccountApiError, accountApi, accountSessionEnded, normalizedPhone, type CheckoutInput, type PublicCheckoutInput, type CheckoutPayment, type CheckoutQuote } from "@/lib/account/api";
import { money } from "@/lib/account/data";
import type { Address, DeliveryDivision, Profile } from "@/lib/account/types";
import { variantImage } from "@/lib/catalog";
import { readPendingOrder, storePendingOrder, type PendingOrder } from "./checkout-session";
import "./CheckoutOtpDialog.css";

const control = "min-h-10 w-full rounded-full border border-[#e3e3e3] bg-white px-4 text-sm outline-none focus:border-[#888]";
const textAreaControl = "min-h-28 w-full rounded-xl border border-[#e3e3e3] bg-white px-4 py-3 text-sm outline-none focus:border-[#888]";
const primary = "flex min-h-11 w-full items-center justify-center bg-[#e55324] px-4 text-sm font-semibold text-white hover:bg-[#ce451a] disabled:cursor-not-allowed disabled:opacity-50";
const CHECKOUT_OTP_RESEND_SECONDS = 45;
type Customer = { profile: Profile; areas: DeliveryDivision[]; addresses: Address[] };
type Verification = { input: CheckoutInput; save: boolean; publicCheckout: boolean; phoneEnding?: string };

function message(error: unknown) {
  return error instanceof AccountApiError ? error.message : "Couldn’t reach the order service. Please try again.";
}

export function CheckoutPage() {
  const router = useRouter();
  const { count, openCart, removeOrderedItems } = useCart();
  const { rows, loading: catalogLoading, loadError: catalogError } = useCartCatalog();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [areas, setAreas] = useState<DeliveryDivision[]>([]);
  const [accountState, setAccountState] = useState<"loading" | "unauthenticated" | "ready" | "error">("loading");
  const [addressId, setAddressId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [thanaId, setThanaId] = useState("");
  const [sslEnabled, setSslEnabled] = useState(false);
  const [payment, setPayment] = useState<CheckoutPayment>("CASH_ON_DELIVERY");
  const [verification, setVerification] = useState<Verification>();
  const [verificationError, setVerificationError] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [quote, setQuote] = useState<{ key: string; value: CheckoutQuote }>();
  const [quoteError, setQuoteError] = useState<{ key: string; text: string }>();
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const pendingRef = useRef<PendingOrder | null>(null);

  const complete = useCallback((id: string, items: VariantCartItem[], addressSaveFailed = false) => {
    try { removeOrderedItems(items); } catch { /* An order confirmation is still available if storage is blocked. */ }
    storePendingOrder(null);
    router.replace(`/checkout/success/${id}${addressSaveFailed ? "?address=unsaved" : ""}`);
  }, [removeOrderedItems, router]);

  useEffect(() => {
    let active = true;
    const signOut = () => {
      setAccountState("unauthenticated");
      setCustomer(null);
      setPayment("CASH_ON_DELIVERY");
      setSslEnabled(false);
      setAddressId("");
    };
    window.addEventListener(accountSessionEnded, signOut);

    async function load() {
      try {
        const profile = await accountApi.profile();
        const pending = readPendingOrder();
        if (pending?.userId === profile.id) {
          pendingRef.current = pending;
          const order = await accountApi.recoverCheckout(pending.id);
          if (order.id && active) {
            setSubmitting(true);
            if (pending.paymentMethod === "SSL_COMMERZ") {
              storePendingOrder({ ...pending, orderId: order.id });
              router.replace(`/checkout/pending/${order.id}`);
            } else {
              complete(order.id, pending.items);
            }
            return;
          }
        }
        const [addresses, areas, payment] = await Promise.all([
          accountApi.addresses(),
          accountApi.deliveryAreas(),
          fetch("/api/payment-config", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
        ]);
        if (!active) return;
        const availableAreas = new Set(areas.flatMap((division) =>
          division.districts.flatMap((district) => district.thanas.filter((thana) => thana.isDeliverable).map((thana) => thana.id)),
        ));
        const deliverable = addresses.filter((address) => availableAreas.has(address.thanaId));
        setCustomer({ profile, addresses: deliverable, areas });
        setAreas(areas);
        setAddressId((deliverable.find((address) => address.isDefaultShipping) ?? deliverable[0])?.id ?? "");
        setSslEnabled(payment?.sslCommerzEnabled === true);
        setAccountState("ready");
      } catch (error) {
        if (!active) return;
        if (error instanceof AccountApiError && error.status === 401) {
          try {
            const [publicAreas, payment] = await Promise.all([
              accountApi.publicCheckoutDeliveryAreas(),
              fetch("/api/payment-config", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null),
            ]);
            if (active) {
              setAreas(publicAreas);
              setSslEnabled(payment?.sslCommerzEnabled === true);
              setAccountState("unauthenticated");
            }
          } catch {
            if (active) setAccountState("error");
          }
        } else {
          setAccountState("error");
        }
      }
    }

    void load();
    return () => { active = false; window.removeEventListener(accountSessionEnded, signOut); };
  }, [complete, router]);

  const division = areas.find((entry) => entry.id === divisionId);
  const district = division?.districts.find((entry) => entry.id === districtId);
  const thana = district?.thanas.find((entry) => entry.id === thanaId && entry.isDeliverable);
  const saved = customer?.addresses.find((entry) => entry.id === addressId);
  const items = rows.flatMap(({ item, variant }) =>
    "variantId" in item && variant && item.quantity <= 99 ? [item] : [],
  );
  const cartReady = !catalogLoading && !catalogError && items.length > 0 && items.length === rows.length && items.length <= 50;
  const delivery = saved ? { addressId: saved.id } : thana ? { thanaId: thana.id } : null;
  const quoteKey = (accountState === "ready" || accountState === "unauthenticated") && cartReady && delivery
    ? JSON.stringify({ items, ...delivery }) : "";
  const currentQuote = quote?.key === quoteKey ? quote.value : null;
  const currentError = quoteError?.key === quoteKey ? quoteError.text : "";

  useEffect(() => {
    if (!quoteKey) return;
    let active = true;
    const quoteRequest = accountState === "unauthenticated"
      ? accountApi.quotePublicCheckout(JSON.parse(quoteKey))
      : accountApi.quoteOrder(JSON.parse(quoteKey));
    quoteRequest.then((value) => {
      if (active) setQuote({ key: quoteKey, value });
    }).catch((error) => {
      if (active) setQuoteError({ key: quoteKey, text: message(error) });
    });
    return () => { active = false; };
  }, [quoteKey, quoteAttempt, accountState]);

  function refreshQuote() {
    setQuote(undefined);
    setQuoteError(undefined);
    setQuoteAttempt((value) => value + 1);
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!customer && accountState !== "unauthenticated") || !currentQuote || submittingRef.current) return;
    const values = new FormData(event.currentTarget);
    const text = (field: string) => String(values.get(field) ?? "").trim();
    const contactEmail = text("contactEmail");
    const phone = normalizedPhone(text("phone"));
    const emergencyContactPhone = normalizedPhone(text("emergencyContactPhone"));
    const firstName = text("firstName");
    const lastName = text("lastName");
    const shipping = saved ? { addressId: saved.id } : division && district && thana ? {
      shippingAddress: {
        thanaId: thana.id, name: `${firstName} ${lastName}`.trim(), phone, region: division.name, city: district.name,
        area: thana.name, address: text("address"), postalCode: text("postalCode"),
      },
    } : null;
    if (!shipping) return;
    if (!contactEmail) {
      setSubmitError("Enter an email address for order updates.");
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(emergencyContactPhone)) {
      setSubmitError("Enter a valid emergency contact number, including the country code.");
      return;
    }
    if ("shippingAddress" in shipping && (!/^\+[1-9]\d{7,14}$/.test(phone) || !firstName || !lastName || !text("address"))) {
      setSubmitError("Enter your first and last name, a valid phone number and a street address.");
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError("");
    let placed = false;
    try {
      const input = { items, ...shipping, contactEmail, emergencyContactPhone, paymentMethod: payment, expectedTotal: Number(currentQuote.total) };
      if (!customer) {
        if (!("shippingAddress" in input)) throw new Error("Enter a delivery address to continue.");
        const challenge: Verification = {
          input: { ...input, checkoutId: crypto.randomUUID() } as PublicCheckoutInput,
          save: values.has("save"), publicCheckout: true,
        };
        setVerification(challenge);
        await sendCode(challenge);
        return;
      }
      const userId = customer.profile.id;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(input)));
      const signature = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
      let pending = pendingRef.current;
      if (pending?.userId === userId && pending.signature !== signature) {
        const previous = await accountApi.recoverCheckout(pending.id);
        if (previous.id) {
          placed = true;
          if (pending.paymentMethod === "SSL_COMMERZ") {
            storePendingOrder({ ...pending, orderId: previous.id });
            router.replace(`/checkout/pending/${previous.id}`);
          } else {
            complete(previous.id, pending.items);
          }
          return;
        }
      }
      if (pending?.userId !== userId || pending.signature !== signature) {
        pending = { id: crypto.randomUUID(), userId, signature, items, paymentMethod: payment };
        pendingRef.current = pending;
        storePendingOrder(pending);
      }
      const challenge: Verification = { input: { ...input, checkoutId: pending.id }, save: values.has("save"), publicCheckout: false };
      setVerification(challenge);
      await sendCode(challenge);
    } catch (error) {
      setSubmitError(message(error));
      if (error instanceof AccountApiError && error.status === 409) refreshQuote();
    } finally {
      if (!placed) {
        setSubmitting(false);
        submittingRef.current = false;
      }
    }
  }

  async function sendCode(challenge: Verification) {
    setSendingCode(true);
    setVerificationError("");
    try {
      const { phoneEnding } = challenge.publicCheckout
        ? await accountApi.requestPublicCheckoutCode(challenge.input as PublicCheckoutInput)
        : await accountApi.requestCheckoutCode(challenge.input);
      setVerification({ ...challenge, phoneEnding });
    } catch (error) {
      setVerificationError(message(error));
      if (error instanceof AccountApiError && error.status === 409) refreshQuote();
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCheckout(code: string) {
    const pending = pendingRef.current;
    if (!verification || (!verification.publicCheckout && (!customer || !pending)) || submittingRef.current || sendingCode) return;
    submittingRef.current = true;
    setSubmitting(true);
    setVerificationError("");
    let order: { id: string; orderCode?: string };
    try {
      order = verification.publicCheckout
        ? await accountApi.completePublicCheckout(verification.input as PublicCheckoutInput, code)
        : await accountApi.placeOrder(verification.input, code);
    } catch (error) {
      if (!verification.publicCheckout && error instanceof AccountApiError && [404, 409].includes(error.status)) {
        storePendingOrder(null);
        pendingRef.current = null;
        router.replace("/checkout/failed");
        return;
      }
      setVerificationError(message(error));
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }
    if (verification.publicCheckout) {
      const shipping = "shippingAddress" in verification.input ? verification.input.shippingAddress : null;
      let addressSaveFailed = false;
      if (verification.save && shipping) {
        const { thanaId, name, phone, region, city, area, address, postalCode } = shipping;
        await accountApi.saveAddress({
          id: "", label: "Home", thanaId, fullName: name, phone, region, city, area,
          addressLine: address, postalCode, isDefaultShipping: true, isDefaultBilling: false,
        }).catch(() => { addressSaveFailed = true; });
      }
      if (verification.input.paymentMethod === "CASH_ON_DELIVERY") {
        complete(order.id, verification.input.items, addressSaveFailed);
        return;
      }
      try {
        const result = await accountApi.startPayment(order.id);
        if (result.gatewayUrl) window.location.assign(result.gatewayUrl);
        else router.replace(`/checkout/${result.outcome}/${order.id}`);
      } catch {
        router.replace(`/checkout/failed/${order.id}`);
      }
      return;
    }
    if (!customer || !pending) return;
    const shipping = "shippingAddress" in verification.input ? verification.input.shippingAddress : null;
    if (verification.input.paymentMethod === "SSL_COMMERZ") {
      storePendingOrder({ ...pending, orderId: order.id });
    }
    let addressSaveFailed = false;
    if (verification.save && shipping) {
      const { thanaId, name, phone, region, city, area, address, postalCode } = shipping;
      await accountApi.saveAddress({
        id: "", label: "Home", thanaId, fullName: name, phone, region, city, area,
        addressLine: address, postalCode, isDefaultShipping: customer.addresses.length === 0, isDefaultBilling: false,
      }).catch(() => { addressSaveFailed = true; });
    }
    if (verification.input.paymentMethod === "CASH_ON_DELIVERY") {
      complete(order.id, pending.items, addressSaveFailed);
      return;
    }
    try {
      const result = await accountApi.startPayment(order.id);
      if (result.gatewayUrl) window.location.assign(result.gatewayUrl);
      else router.replace(`/checkout/${result.outcome}/${order.id}`);
    } catch {
      router.replace(`/checkout/failed/${order.id}`);
    }
  }

  if (!catalogLoading && !rows.length && !submitting) {
    return <main className="min-h-screen px-5 py-24 text-center"><p>Your cart is empty.</p>
      <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-[#af3b17] underline">Continue shopping</Link>
    </main>;
  }

  const subtotal = rows.reduce((sum, { item, variant }) => sum + (variant ? Number(variant.price) * item.quantity : 0), 0);

  return (
    <main className="min-h-screen bg-white px-4 pb-12 pt-5 text-[#292929] sm:px-6">
      <div className="mx-auto max-w-[1440px]">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#666]">
          <Link href="/">Home</Link><span aria-hidden="true">›</span>
          <button type="button" onClick={openCart} className="cursor-pointer hover:underline">Cart</button><span aria-hidden="true">›</span>
          <span aria-current="page">Checkout</span>
        </nav>
        <h1 className="mb-7 mt-3 text-center text-[32px] font-semibold tracking-tight">Checkout</h1>
        <form onSubmit={submitCheckout} className="grid items-start gap-4 lg:grid-cols-[1fr_1.08fr]">
          <div className="space-y-3">
            <section className="border border-[#e8e8e8] p-4">
              <h2 className="text-sm font-semibold">Shipping &amp; Delivery</h2>
              {accountState === "loading" && <p role="status" className="mt-4 text-sm text-[#666]">Loading your shipping details…</p>}
              {accountState === "error" && <p role="alert" className="mt-4 text-sm text-[#a04433]">
                Couldn’t load shipping details. <button type="button" onClick={() => window.location.reload()} className="cursor-pointer underline">Try again</button>
              </p>}
              {(customer || accountState === "unauthenticated") && <fieldset disabled={submitting} className="mt-4 space-y-3">
                {!!customer?.addresses.length && <Select label="Shipping address" value={addressId} onChange={(id) => { setAddressId(id); setSubmitError(""); }}>
                  {customer.addresses.map((address) => <option value={address.id} key={address.id}>{address.label} · {address.addressLine}, {address.area}</option>)}
                  <option value="">Use a new address</option>
                </Select>}
                {saved ? <div className="bg-[#f6f4f0] p-3 text-sm leading-6">
                  <strong>{saved.fullName}</strong><br />
                  {saved.addressLine}, {saved.area}, {saved.city}, {saved.region}<br />
                  {saved.phone}
                </div> : <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First Name" name="firstName" autoComplete="given-name" required maxLength={80} defaultValue={customer?.profile.name.split(" ")[0] ?? ""} />
                    <Field label="Last Name" name="lastName" autoComplete="family-name" required maxLength={80} defaultValue={customer?.profile.name.split(" ").slice(1).join(" ") ?? ""} />
                    <Field label="Phone Number" name="phone" type="tel" autoComplete="tel" required maxLength={20} placeholder="017XXXXXXXX" defaultValue={customer?.profile.phone ?? ""} />
                    <Field label="Email" name="contactEmail" type="email" autoComplete="email" required maxLength={255} defaultValue={customer?.profile.email ?? ""} />
                    <Field label="Emergency Contact Number" name="emergencyContactPhone" type="tel" autoComplete="tel" required maxLength={20} placeholder="017XXXXXXXX" />
                    <div className="hidden sm:block" aria-hidden="true" />
                    <Select label="Division" value={divisionId} onChange={(id) => { setDivisionId(id); setDistrictId(""); setThanaId(""); setSubmitError(""); }} required>
                      <option value="">Select Division</option>
                      {areas.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                    </Select>
                    <Select label="District" value={districtId} onChange={(id) => { setDistrictId(id); setThanaId(""); setSubmitError(""); }} disabled={!division} required>
                      <option value="">Select District</option>
                      {division?.districts.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                    </Select>
                    <Select label="Upazila / Thana" value={thanaId} onChange={(id) => { setThanaId(id); setSubmitError(""); }} disabled={!district} required>
                      <option value="">Select Upazila / Thana</option>
                      {district?.thanas.map((entry) => <option key={entry.id} value={entry.id} disabled={!entry.isDeliverable}>{entry.name}{entry.isDeliverable ? "" : " — unavailable"}</option>)}
                    </Select>
                    <Field label="Postal Code (Optional)" name="postalCode" autoComplete="postal-code" maxLength={20} placeholder="1212" />
                    <TextArea label="Address" name="address" autoComplete="street-address" required maxLength={500} placeholder="Enter your full address" className="sm:col-span-2" />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-[#555]"><input type="checkbox" name="save" className="accent-[#f15a22]" />Save this address to my account</label>
                </>}
                {saved && <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" name="contactEmail" type="email" autoComplete="email" required maxLength={255} defaultValue={customer?.profile.email ?? ""} />
                  <Field label="Emergency Contact Number" name="emergencyContactPhone" type="tel" autoComplete="tel" required maxLength={20} placeholder="017XXXXXXXX" />
                </div>}
              </fieldset>}
            </section>
            <section id="payment-method" className="border border-[#e8e8e8] p-4">
              <h2 className="text-sm font-semibold">Payment Method</h2>
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="radio" name="payment" checked={payment === "CASH_ON_DELIVERY"} onChange={() => setPayment("CASH_ON_DELIVERY")} className="accent-[#f15a22]" />Cash on Delivery (COD)</label>
              <p className="mt-1 pl-5 text-xs text-[#666]">Pay when your order arrives</p>
              {sslEnabled && <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="radio" name="payment" checked={payment === "SSL_COMMERZ"} onChange={() => setPayment("SSL_COMMERZ")} className="accent-[#f15a22]" />Pay online with SSLCommerz
              </label>}
            </section>
          </div>

          <section className="border border-[#e8e8e8] p-4 lg:sticky lg:top-5">
            <h2 className="text-sm font-semibold">Order Summary</h2>
            {catalogLoading && <p role="status" className="py-4 text-xs text-[#666]">Loading products…</p>}
            {catalogError && <p role="alert" className="py-4 text-xs text-[#a04433]">Couldn’t load your cart. Reload to try again.</p>}
            {!catalogLoading && !catalogError && <div className="mt-2 divide-y divide-[#eee]">
              {rows.map(({ item, product, variant }) => {
                if (!product || !variant) return <p key={cartKey(item)} className="py-3 text-xs text-[#a04433]">A cart item is no longer available.</p>;
                const image = variantImage(variant);
                const line = currentQuote?.items.find((entry) => entry.variantId === variant.id);
                return <article key={cartKey(item)} className="flex items-center gap-3 py-2.5">
                  <div className="size-[46px] shrink-0 overflow-hidden bg-[#f4f2ed]">
                    {image && <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-[#666]">{variant.name} · Qty {item.quantity}</p></div>
                  <strong className="shrink-0 text-sm font-medium">{money(line ? Number(line.lineTotal) : Number(variant.price) * item.quantity)}</strong>
                </article>;
              })}
            </div>}
            {!catalogLoading && !catalogError && !cartReady && <p role="alert" className="my-2 text-xs text-[#a04433]">
              Check item availability and quantities in your <button type="button" onClick={openCart} className="cursor-pointer underline">cart</button>.
            </p>}
            <dl className="mt-2 border-t border-[#e5e5e5] pt-3 text-sm">
              <TotalRow label="Total items" value={String(count)} />
              <TotalRow label="Subtotal" value={money(currentQuote ? Number(currentQuote.subtotal) : subtotal)} />
              <TotalRow label="Delivery charge" value={currentQuote ? money(Number(currentQuote.shippingCharge)) : quoteKey && !currentError ? "Calculating…" : "Select a delivery area"} />
              <TotalRow label="Total" value={currentQuote ? money(Number(currentQuote.total)) : "—"} total />
            </dl>
            {currentError && <p role="alert" className="mt-3 text-xs text-[#a04433]">{currentError} <button type="button" onClick={refreshQuote} className="cursor-pointer underline">Retry total</button></p>}
            <button type="submit" disabled={!currentQuote || submitting || !!verification} className={`mt-4 ${primary}`}>
              {submitting ? "Processing…" : "Checkout"}
            </button>
            {submitError && <p role="alert" className="mt-3 text-sm text-[#a04433]">{submitError}</p>}
          </section>
        </form>
        {verification && <CheckoutOtpDialog
          phoneEnding={verification.phoneEnding} error={verificationError}
          sending={sendingCode} verifying={submitting && !sendingCode}
          onClose={() => { setVerification(undefined); setVerificationError(""); }}
          onResend={() => void sendCode(verification)}
          onVerify={(code) => void verifyCheckout(code)}
        />}
      </div>
    </main>
  );
}

function CheckoutOtpDialog({ phoneEnding, error, sending, verifying, onClose, onResend, onVerify }: {
  phoneEnding?: string; error: string; sending: boolean; verifying: boolean;
  onClose: () => void; onResend: () => void; onVerify: (code: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [resendSeconds, setResendSeconds] = useState(300);
  const busy = sending || verifying;
  const code = digits.join("");
  useEffect(() => {
    dialog.current?.showModal();
    inputs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (!phoneEnding) return;
    setResendSeconds(CHECKOUT_OTP_RESEND_SECONDS);
  }, [phoneEnding]);
  useEffect(() => {
    if (!phoneEnding || resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [phoneEnding, resendSeconds]);

  function updateDigit(index: number, value: string) {
    const next = [...digits];
    const pasted = value.replace(/\D/g, "").slice(0, 6 - index);
    if (!pasted) {
      next[index] = "";
      setDigits(next);
      inputs.current[index]?.focus();
      return;
    }
    for (let offset = 0; offset < pasted.length; offset += 1) next[index + offset] = pasted[offset];
    setDigits(next);
    inputs.current[Math.min(index + pasted.length, 5)]?.focus();
  }

  return <dialog ref={dialog} aria-labelledby="checkout-otp-title"
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    className="checkout-otp-dialog fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#eee7e2] bg-white p-6 text-[#292929] shadow-[0_24px_80px_rgba(33,24,18,0.24)] backdrop:bg-[#201811]/55 sm:p-8">
    <div className="relative text-center">
      <span aria-hidden="true" className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-[#fff1eb] text-[#e55324]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5"><path d="M7 3h10v18H7z"/><path d="M10 6h4M11 18h2"/></svg>
      </span>
      <h2 id="checkout-otp-title" className="font-serif text-2xl font-semibold tracking-tight sm:text-[28px]">Verify your phone</h2>
      <button type="button" aria-label="Close phone verification" disabled={busy}
        onClick={onClose} className="absolute right-0 top-0 cursor-pointer p-1 text-2xl leading-none text-[#777] transition hover:text-[#292929] disabled:opacity-50">×</button>
    </div>
    <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-[#666]">
      {sending ? "Sending your verification code…" : phoneEnding ? <>Enter the 6-digit code sent to <span className="font-medium text-[#292929]">••••••{phoneEnding}</span> to continue checkout.</> :
        "Enter the 6-digit code sent to your phone to continue checkout."}
    </p>
    <form className="mt-7" onSubmit={(event) => { event.preventDefault(); if (!busy && /^\d{6}$/.test(code)) onVerify(code); }}>
      <div className="mx-auto flex max-w-[280px] justify-center gap-2" aria-label="Six-digit verification code">
        {digits.map((digit, index) => <input key={index} ref={(node) => { inputs.current[index] = node; }}
          aria-label={`Verification digit ${index + 1}`} name={index === 0 ? "code" : undefined}
          autoComplete={index === 0 ? "one-time-code" : "off"} inputMode="numeric" pattern="[0-9]*" maxLength={6}
          value={digit} disabled={busy} onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              if (digit) updateDigit(index, "");
              else if (index > 0) updateDigit(index - 1, "");
              return;
            }
            if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
            if (event.key === "ArrowRight" && index < 5) inputs.current[index + 1]?.focus();
          }}
          onPaste={(event) => { event.preventDefault(); updateDigit(index, event.clipboardData.getData("text")); }}
          className={`size-10 rounded-lg border bg-white text-center text-lg font-semibold outline-none transition focus:border-[#e55324] focus:ring-2 focus:ring-[#e55324]/15 disabled:bg-[#f7f5f3] sm:size-11 ${error ? "border-[#c83d2b]" : "border-[#e4e0dc]"}`} />)}
      </div>
      {error && <p role="alert" className="mt-3 text-center text-sm text-[#a04433]">{error}</p>}
      <p className="mt-6 text-center text-sm text-[#666]">
        Didn’t receive a code? {phoneEnding && resendSeconds > 0
          ? <span className="font-medium text-[#888]">Resend in {`${String(Math.floor(resendSeconds / 60)).padStart(2, "0")}:${String(resendSeconds % 60).padStart(2, "0")}`}</span>
          : <button type="button" disabled={busy} onClick={() => { setDigits(["", "", "", "", "", ""]); setResendSeconds(CHECKOUT_OTP_RESEND_SECONDS); onResend(); }}
            className="cursor-pointer font-semibold text-[#e55324] underline underline-offset-2 disabled:opacity-50">{phoneEnding ? "Resend code" : "Send code"}</button>}
      </p>
      <button type="submit" disabled={busy || code.length !== 6} className={`mt-5 ${primary} rounded-full`}>
        {verifying ? "Verifying…" : "Verify & Continue"}
      </button>
      <button type="button" disabled={busy} onClick={onClose}
        className="mt-3 w-full cursor-pointer text-center text-sm text-[#666] underline underline-offset-2 transition hover:text-[#e55324] disabled:opacity-50">
        Change phone number
      </button>
    </form>
  </dialog>;
}

function Field({ label, className, required, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`grid gap-1.5 text-sm font-medium ${className ?? ""}`}>
    <span>{label}{required && <span className="text-red-600"> *</span>}</span>
    <input {...props} required={required} className={control} />
  </label>;
}

function Select({ label, children, value, onChange, ...props }: {
  label: string; children: React.ReactNode; value: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean;
}) {
  return <label className="grid gap-1.5 text-sm font-medium">
    <span>{label}{props.required && <span className="text-red-600"> *</span>}</span>
    <select className={control} value={value} onChange={(event) => onChange(event.target.value)} {...props}>{children}</select>
  </label>;
}

function TextArea({ label, className, required, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <label className={`grid gap-1.5 text-sm font-medium ${className ?? ""}`}>
    <span>{label}{required && <span className="text-red-600"> *</span>}</span>
    <textarea {...props} required={required} className={textAreaControl} />
  </label>;
}

function TotalRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return <div className={`flex justify-between gap-4 py-1 ${total ? "mt-2 border-t border-dashed border-[#ddd] pt-3 font-semibold" : "text-[#666]"}`}>
    <dt>{label}</dt><dd>{value}</dd>
  </div>;
}
