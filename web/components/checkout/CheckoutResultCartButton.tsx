"use client";

import { useCart } from "@/components/cart/CartProvider";

export function CheckoutResultCartButton({ label, className }: { label: string; className?: string }) {
  const { openCart } = useCart();

  return (
    <button type="button" aria-haspopup="dialog" onClick={openCart} className={className}>
      {label}
    </button>
  );
}
