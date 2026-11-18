import { CheckoutPlacementFailure } from "@/components/checkout/CheckoutPlacementFailure";

export const metadata = { title: "Order could not be placed", robots: { index: false, follow: false } };

export default function Page() {
  return <CheckoutPlacementFailure />;
}
