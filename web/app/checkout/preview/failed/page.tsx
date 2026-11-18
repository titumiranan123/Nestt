import { CheckoutResultPreview } from "../CheckoutResultPreview";

export const metadata = { title: "Failed" };

export default function CheckoutFailedPreview() {
  return <CheckoutResultPreview status="failed" />;
}
