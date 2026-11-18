import { CheckoutResultPreview } from "../CheckoutResultPreview";

export const metadata = { title: "Success" };

export default function CheckoutSuccessPreview() {
  return <CheckoutResultPreview status="success" />;
}
