import { Suspense } from "react";
import { OrdersPage } from "@/components/account/OrdersPage";
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading orders…</p>}>
      <OrdersPage />
    </Suspense>
  );
}
