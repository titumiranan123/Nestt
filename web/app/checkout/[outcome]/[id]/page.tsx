import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";

export const metadata = { title: "Checkout result", robots: { index: false, follow: false } };

export default function Page(props: PageProps<"/checkout/[outcome]/[id]">) {
  return <Suspense fallback={<p className="p-8 text-center text-sm">Loading order…</p>}>
    <Result {...props} />
  </Suspense>;
}

async function Result({ params, searchParams }: PageProps<"/checkout/[outcome]/[id]">) {
  const [{ id, outcome }, query] = await Promise.all([params, searchParams]);
  if (outcome !== "success" && outcome !== "failed" && outcome !== "cancelled" && outcome !== "pending") notFound();
  return <OrderConfirmation key={id} id={id} expected={outcome} addressSaveFailed={query.address === "unsaved"} />;
}
