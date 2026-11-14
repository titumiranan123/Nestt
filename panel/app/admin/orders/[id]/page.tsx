"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { OrderStatus } from "@/lib/demo-admin-data";
import { demoOrders } from "@/lib/demo-admin-data";
import { confirmAdminAction, showAdminNotice } from "@/lib/admin-swal";
import { CustomerCard } from "@/components/admin/orders/CustomerCard";
import { DeliveryAddressCard } from "@/components/admin/orders/DeliveryAddressCard";
import { InternalNoteCard } from "@/components/admin/orders/InternalNoteCard";
import { OrderBreadcrumbs } from "@/components/admin/orders/OrderBreadcrumbs";
import { OrderDetailHeader } from "@/components/admin/orders/OrderDetailHeader";
import { OrderItemsCard } from "@/components/admin/orders/OrderItemsCard";
import { OrderStatusBanner } from "@/components/admin/orders/OrderStatusBanner";
import { OrderStatusCard } from "@/components/admin/orders/OrderStatusCard";
import { OrderTimeline } from "@/components/admin/orders/OrderTimeline";
import { PaymentCard } from "@/components/admin/orders/PaymentCard";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const order = useMemo(() => demoOrders.find((item) => item.id === params.id) ?? demoOrders[0], [params.id]);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>(order.status);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const itemTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const showMoreActions = () => void showAdminNotice("More order actions", "A return label can be generated when the fulfillment service is connected.");
  const saveNote = () => { setNoteSaved(true); void showAdminNotice("Note saved", "This note is saved in the current demo session.", "success"); };
  const updateStatus = async () => {
    if (pendingStatus === "Cancelled" && !(await confirmAdminAction("Cancel this order?", "This demo status change can be reset by refreshing the page."))) return;
    setStatus(pendingStatus);
    setStatusUpdated(true);
    void showAdminNotice("Order status updated", `The demo order is now ${pendingStatus.toLowerCase()}.`, "success");
  };

  return <div className="animate-fade-up space-y-5">
    <OrderBreadcrumbs id={order.id}/>
    <OrderDetailHeader order={order} onMoreActions={showMoreActions}/>
    <OrderStatusBanner order={order} status={status}/>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
      <div className="grid gap-5"><OrderItemsCard order={order} itemTotal={itemTotal}/><OrderTimeline order={order}/><InternalNoteCard note={note} saved={noteSaved} onNoteChange={(value) => { setNote(value); setNoteSaved(false); }} onSave={saveNote}/></div>
      <aside className="grid gap-5"><OrderStatusCard status={status} pendingStatus={pendingStatus} updated={statusUpdated} onPendingChange={(value) => { setPendingStatus(value); setStatusUpdated(false); }} onUpdate={() => void updateStatus()}/><CustomerCard order={order}/><DeliveryAddressCard order={order}/><PaymentCard order={order}/></aside>
    </div>
  </div>;
}
