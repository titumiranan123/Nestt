import type { ReactNode } from "react";
import { NesttFurnitureHomePageFooter } from "@/components/home-page/NesttFurnitureHomePageFooter";

export function StorefrontChrome({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white text-[#292929]">
    {children}
    <NesttFurnitureHomePageFooter />
  </div>;
}
