import { CheckoutResultPreview } from "../CheckoutResultPreview";

export const metadata = { title: "Cancelled" };

export default function CheckoutCancelledPreview() {
  return <CheckoutResultPreview status="cancelled" />;
}
