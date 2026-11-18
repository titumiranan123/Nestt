import type { ReactNode } from "react";
import { StorefrontChrome } from "@/components/navigation/StorefrontChrome";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <StorefrontChrome>{children}</StorefrontChrome>;
}
