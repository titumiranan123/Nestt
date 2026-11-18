import { Suspense } from "react";
import { OrderDetailsPage } from "@/components/account/OrderDetailsPage";
async function Details({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailsPage id={id} key={id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p role="status">Loading your order…</p>}>
      <Details params={params} />
    </Suspense>
  );
}
