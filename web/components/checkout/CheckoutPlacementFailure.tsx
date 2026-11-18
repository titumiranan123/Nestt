"use client";

import { cartKey } from "@/components/cart/CartProvider";
import { useCartCatalog } from "@/components/cart/useCartCatalog";
import { catalogImageUrl, variantImage } from "@/lib/catalog";
import { CheckoutResult } from "./CheckoutResult";

export function CheckoutPlacementFailure() {
  const { rows } = useCartCatalog();
  const items = rows.flatMap(({ item, product, variant }) => product && variant ? [{
    id: cartKey(item), name: product.name, variant: variant.name, quantity: item.quantity,
    image: catalogImageUrl(variantImage(variant)?.url),
    lineTotal: Number(variant.price) * item.quantity,
  }] : []);
  return <CheckoutResult status="failed" orderPlacementFailed summary={{
    items, delivery: 0, total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  }} />;
}
