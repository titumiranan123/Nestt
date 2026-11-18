import { CheckoutResult, type CheckoutOutcome } from "@/components/checkout/CheckoutResult";

const previewSummary = {
  items: [{
    id: "oslo",
    name: "Oslo High-Back Recliner",
    variant: "Cognac Leather",
    quantity: 1,
    lineTotal: 48_500,
    image: "/assets/figma-home/product-oslo.png",
  }],
  delivery: 1_000,
  total: 49_500,
};

export function CheckoutResultPreview({ status }: { status: CheckoutOutcome }) {
  if (status === "success") {
    return (
      <CheckoutResult
        status={status}
        summary={previewSummary}
        confirmation={{
          orderNumber: "NST-10482",
          paymentLabel: "Paid via SSLCommerz",
          orderHref: "/account/orders",
        }}
        preview
      />
    );
  }

  return <CheckoutResult status={status} summary={previewSummary} preview />;
}
