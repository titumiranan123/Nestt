"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, CreditCard, MapPin, Package, Phone, Printer, Save, ShieldAlert, Truck } from "lucide-react";
import { OrderStatusPill } from "@/components/admin/orders/OrderStatusPill";
import { AdminLoadingSkeleton } from "@/components/admin/shared/AdminLoadingSkeleton";
import { ordersApi } from "@/features/orders/api";
import type { OrderStatus } from "@/features/orders/types";
import { usePermission } from "@/hooks/use-permission";
import { getErrorMessage } from "@/lib/api/errors";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";

const card = "rounded-xl border border-gray-200 bg-white p-4 sm:p-5";
const money = (value: string | number) => new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(Number(value));
const readable = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const transitions: Record<OrderStatus, OrderStatus[]> = { PENDING: ["CONFIRMED", "CANCELLED"], CONFIRMED: ["PROCESSING", "CANCELLED"], PROCESSING: ["SHIPPED", "CANCELLED"], SHIPPED: ["DELIVERED"], DELIVERED: [], CANCELLED: [] };

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const canUpdate = usePermission("orders:update");
  const queryKey = ["admin", "orders", id] as const;
  const order = useQuery({ queryKey, queryFn: () => ordersApi.get(id), enabled: Boolean(id) });
  const statusMutation = useMutation({ mutationFn: ({ status, note }: { status: OrderStatus; note?: string }) => ordersApi.updateStatus(id, status, note), onSuccess: async (data) => { queryClient.setQueryData(queryKey, data); await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }); } });
  const paymentMutation = useMutation({ mutationFn: ({ status, reference }: { status: "PAID" | "FAILED"; reference?: string }) => ordersApi.updatePayment(id, status, reference), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); await queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }); } });
  const remarkMutation = useMutation({ mutationFn: ({ note, isInternal }: { note: string; isInternal: boolean }) => ordersApi.addRemark(id, note, isInternal), onSuccess: async () => { setRemark(""); await queryClient.invalidateQueries({ queryKey }); } });
  const returnMutation = useMutation({ mutationFn: ({ returnId, status }: { returnId: string; status: "APPROVED" | "REJECTED" | "RECEIVED" }) => ordersApi.updateReturn(returnId, status), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); } });
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [remark, setRemark] = useState("");
  const [internalRemark, setInternalRemark] = useState(true);
  const current = order.data;
  const allowedStatuses = useMemo(() => current ? transitions[current.status].filter((status) => status !== "CANCELLED" || current.paymentStatus !== "PAID") : [], [current]);

  useEffect(() => { if (current) setNextStatus(allowedStatuses[0] ?? ""); }, [current?.status, current?.paymentStatus, allowedStatuses]);

  const changeStatus = async () => {
    if (!nextStatus) return;
    if (nextStatus === "CANCELLED" && !await confirmAdminAction(`Cancel ${current?.orderCode}?`, "Reserved stock will be returned to inventory.")) return;
    try {
      const saved = await statusMutation.mutateAsync({ status: nextStatus, note: statusNote.trim() || undefined });
      setStatusNote("");
      void showAdminNotice("Order status updated", `${saved.orderCode} is now ${readable(saved.status)}.`, "success");
    } catch (error) {
      void showAdminNotice("Could not update order status", getErrorMessage(error), "error");
    }
  };
  const markPayment = async (status: "PAID" | "FAILED") => {
    try {
      await paymentMutation.mutateAsync({ status, reference: paymentReference.trim() || undefined });
      setPaymentReference("");
      void showAdminNotice("Payment updated", `Payment marked ${readable(status).toLowerCase()}.`, "success");
    } catch (error) {
      void showAdminNotice("Could not update payment", getErrorMessage(error), "error");
    }
  };
  const saveRemark = async () => {
    try {
      await remarkMutation.mutateAsync({ note: remark.trim(), isInternal: internalRemark });
      void showAdminNotice("Remark saved", "The order remark has been added.", "success");
    } catch (error) {
      void showAdminNotice("Could not save remark", getErrorMessage(error), "error");
    }
  };

  if (order.isPending) return <AdminLoadingSkeleton kind="editor" label="Loading order details" />;
  if (order.isError || !current) return <section role="alert" className="rounded-xl border border-red-200 bg-white p-8 text-center"><h1 className="font-semibold text-gray-900">Order could not be loaded</h1><p className="mt-2 text-sm text-gray-600">{order.error ? getErrorMessage(order.error) : "Order not found."}</p><div className="mt-4 flex justify-center gap-2"><button type="button" onClick={() => void order.refetch()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Try again</button><Link href="/admin/orders" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">Orders</Link></div></section>;

  const totalItems = current.items.reduce((sum, item) => sum + item.quantity, 0);
  return <div className="animate-fade-up space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500"><Link href="/admin" className="hover:text-brand">Dashboard</Link><span>›</span><Link href="/admin/orders" className="hover:text-brand">Orders</Link><span>›</span><span className="font-semibold text-gray-800">{current.orderCode}</span></nav><button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"><Printer size={15}/>Print order</button></div>
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/45 to-white p-5"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-brand">Order details · {readable(current.orderSource)}</p><h1 className="mt-1 text-2xl font-bold text-gray-950">{current.orderCode}</h1><p className="mt-1 text-sm text-gray-500">Placed {new Date(current.createdAt).toLocaleString()} · {totalItems} item(s)</p></div><OrderStatusPill status={current.status}/></header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <div className="space-y-5">
        <section className={card}><div className="flex items-center gap-2"><Package size={18} className="text-brand"/><h2 className="font-bold text-gray-900">Items ordered</h2></div><div className="mt-4 divide-y divide-gray-100">{current.items.map((item) => <div key={item.id} className="flex items-center gap-3 py-4"><div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-gray-100">{item.image ? <img src={item.image} alt="" className="size-full object-cover"/> : <Package size={18} className="text-gray-400"/>}</div><div className="min-w-0 flex-1"><strong className="block text-sm text-gray-900">{item.productName}</strong><p className="mt-1 text-xs text-gray-500">{item.variantName ?? "Default variant"} · SKU {item.sku ?? "—"}</p></div><span className="text-xs text-gray-500">× {item.quantity}</span><strong className="w-24 text-right text-sm">{money(item.totalPrice)}</strong></div>)}</div><div className="ml-auto mt-4 grid max-w-xs gap-2 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(current.subTotal)}</span></div><div className="flex justify-between text-gray-600"><span>Delivery</span><span>{money(current.shippingCharge)}</span></div><div className="flex justify-between text-gray-600"><span>Discount</span><span>−{money(current.discountAmount)}</span></div><div className="flex justify-between border-t border-gray-200 pt-3 font-bold text-gray-950"><span>Total</span><span>{money(current.totalAmount)}</span></div></div></section>
        <section className={card}><h2 className="font-bold text-gray-900">Order timeline</h2><div className="mt-4 space-y-4">{(current.statusHistories ?? []).map((history) => <div key={history.id} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"><Check size={13}/></span><div><strong className="block text-sm text-gray-800">{readable(history.status)}</strong><p className="mt-1 text-xs text-gray-500">{history.note ?? readable(history.source)} · {new Date(history.createdAt).toLocaleString()}</p></div></div>)}</div></section>
        {current.notes && <section className={card}><h2 className="font-bold text-gray-900">Order note</h2><p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{current.notes}</p></section>}
        <section className={card}><div><h2 className="font-bold text-gray-900">Order remarks</h2><p className="mt-1 text-xs text-gray-500">Add internal team notes or customer-visible remarks.</p></div><div className="mt-3 space-y-2">{(current.remarks ?? []).map((entry) => <article key={entry.id} className="rounded-lg bg-gray-50 p-3"><div className="flex justify-between gap-3"><span className="text-[10px] font-bold uppercase text-brand">{entry.isInternal ? "Internal" : "Customer visible"}</span><time className="text-[10px] text-gray-400">{new Date(entry.createdAt).toLocaleString()}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{entry.note}</p><small className="text-xs text-gray-400">{entry.createdBy?.name ?? "Staff"}</small></article>)}</div><label className="mt-4 block text-xs font-semibold text-gray-700">New remark<textarea maxLength={1000} rows={3} value={remark} onChange={(event) => setRemark(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" placeholder="Add a note to this order"/></label><label className="mt-3 flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={internalRemark} onChange={(event) => setInternalRemark(event.target.checked)}/>Visible to staff only</label><button type="button" disabled={!canUpdate || !remark.trim() || remarkMutation.isPending} onClick={() => void saveRemark()} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-xs font-bold text-white disabled:opacity-50"><Save size={14}/>{remarkMutation.isPending ? "Saving…" : "Save remark"}</button>{remarkMutation.isError && <p role="alert" className="mt-2 text-xs text-red-600">{getErrorMessage(remarkMutation.error)}</p>}</section>
      </div>
      <aside className="space-y-5">
        <section className={card}><div className="flex items-center gap-2"><Truck size={17} className="text-brand"/><h2 className="font-bold text-gray-900">Order status</h2></div><p className="mt-3"><OrderStatusPill status={current.status}/></p><label className="mt-4 block text-xs font-semibold text-gray-700">Move to status<select disabled={!canUpdate || !allowedStatuses.length} value={nextStatus} onChange={(event) => setNextStatus(event.target.value as OrderStatus)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-50">{!allowedStatuses.length && <option value="">No status changes available</option>}{allowedStatuses.map((status) => <option key={status} value={status}>{readable(status)}</option>)}</select></label><label className="mt-3 block text-xs font-semibold text-gray-700">Status note (optional)<input maxLength={1000} value={statusNote} onChange={(event) => setStatusNote(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" placeholder="Add a tracking update"/></label><button type="button" disabled={!canUpdate || !nextStatus || statusMutation.isPending} onClick={() => void changeStatus()} className="mt-3 h-10 w-full rounded-lg bg-brand px-3 text-sm font-semibold text-white disabled:opacity-50">{statusMutation.isPending ? "Updating…" : "Update order"}</button>{statusMutation.isError && <p role="alert" className="mt-2 text-xs text-red-600">{getErrorMessage(statusMutation.error)}</p>}</section>
        <section className={card}><div className="flex items-center gap-2"><CreditCard size={17} className="text-brand"/><h2 className="font-bold text-gray-900">Payment</h2></div><p className="mt-3 text-sm font-semibold text-gray-800">{readable(current.payment?.method ?? "unknown")}</p><p className="mt-1 text-xs text-gray-500">{readable(current.paymentStatus)} · {money(current.payment?.amount ?? current.totalAmount)}</p><label className="mt-4 block text-xs font-semibold text-gray-700">Payment reference<input maxLength={255} value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" placeholder="Optional reference"/></label><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={!canUpdate || current.paymentStatus === "PAID" || current.paymentStatus === "REFUNDED" || current.status === "CANCELLED" || paymentMutation.isPending} onClick={() => void markPayment("PAID")} className="h-9 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white disabled:opacity-40">Mark paid</button><button type="button" disabled={!canUpdate || current.paymentStatus === "PAID" || current.paymentStatus === "REFUNDED" || current.payment?.method === "CASH_ON_DELIVERY" || current.status === "CANCELLED" || paymentMutation.isPending} onClick={() => void markPayment("FAILED")} className="h-9 rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-bold text-red-700 disabled:opacity-40">Mark failed</button></div>{paymentMutation.isError && <p role="alert" className="mt-2 text-xs text-red-600">{getErrorMessage(paymentMutation.error)}</p>}</section>
        <section className={card}>
          <h2 className="font-bold text-gray-900">Customer and delivery</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="font-semibold text-gray-900">{current.shippingName}</p>
            <p className="flex flex-wrap items-center gap-2 text-gray-600">
              <Phone size={14} />{current.shippingPhone}
              {current.contactEmail && <span className={current.orderPhoneVerifiedAt ? "text-emerald-700" : "text-amber-700"}>
                {current.orderPhoneVerifiedAt ? "Verified for this order" : "Awaiting phone verification"}
              </span>}
            </p>
            {current.emergencyContactPhone && <p className="flex items-center gap-2 text-amber-800">
              <ShieldAlert size={14} />Emergency phone {current.emergencyContactPhone}
            </p>}
            {(current.contactEmail ?? current.guestEmail ?? current.user?.email) && <p className="break-all text-gray-600">
              {current.contactEmail ?? current.guestEmail ?? current.user?.email}
            </p>}
            <div className="flex gap-2 border-t border-gray-100 pt-3 text-gray-600">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <p>{current.shippingAddress}<br />{current.shippingArea}, {current.shippingCity}<br />
                {current.shippingRegion}{current.shippingPostalCode ? ` · ${current.shippingPostalCode}` : ""}
              </p>
            </div>
          </div>
        </section>
        {Boolean(current.returns?.length) && <section className={card}><h2 className="font-bold text-gray-900">Return requests</h2><div className="mt-3 space-y-3">{current.returns?.map((request) => { const actions = request.status === "REQUESTED" ? ["APPROVED", "REJECTED"] as const : request.status === "APPROVED" ? ["RECEIVED", "REJECTED"] as const : []; return <article key={request.id} className="rounded-lg border border-gray-100 p-3"><p className="text-xs font-semibold text-gray-800">{request.item.productName} · {readable(request.status)}</p>{request.reason && <p className="mt-1 text-xs text-gray-500">{request.reason}</p>}<div className="mt-2 flex flex-wrap gap-2">{actions.map((status) => <button type="button" key={status} disabled={!canUpdate || returnMutation.isPending} onClick={() => returnMutation.mutate({ returnId: request.id, status })} className="rounded border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-700 disabled:opacity-50">{readable(status)}</button>)}</div></article>; })}</div>{returnMutation.isError && <p role="alert" className="mt-2 text-xs text-red-600">{getErrorMessage(returnMutation.error)}</p>}</section>}
      </aside>
    </div>
    <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand"><ArrowLeft size={15}/>Back to orders</Link>
  </div>;
}
