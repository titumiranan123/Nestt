import { Suspense } from "react";
import { NesttFurnitureHomePageCategoryShoppingSection } from "./NesttFurnitureHomePageCategoryShoppingSection";
import { NesttFurnitureHomePageDesignCircleSection } from "./NesttFurnitureHomePageDesignCircleSection";
import { NesttFurnitureHomePageFooter } from "./NesttFurnitureHomePageFooter";
import { NesttFurnitureHomePageFurnitureExperienceSection } from "./NesttFurnitureHomePageFurnitureExperienceSection";
import { NesttFurnitureHomePageHardwoodPromotionSection } from "./NesttFurnitureHomePageHardwoodPromotionSection";
import { HeroSection } from "./HeroSection";
import { NesttFurnitureHomePageRecommendedProductsSection } from "./NesttFurnitureHomePageRecommendedProductsSection";
import { NesttFurnitureHomePageRoomFitSection } from "./NesttFurnitureHomePageRoomFitSection";
import { NesttFurnitureHomePageRoomShoppingSection } from "./NesttFurnitureHomePageRoomShoppingSection";
import { NesttFurnitureHomePageServiceBenefitsSection } from "./NesttFurnitureHomePageServiceBenefitsSection";
import { NesttFurnitureHomePageTestimonialsSection } from "./NesttFurnitureHomePageTestimonialsSection";
import { NesttFurnitureHomePageFreshArrivalsSection } from "./NesttFurnitureHomePageFreshArrivalsSection";
import { NesttFurnitureHomePageVirtualShowroomSection } from "./NesttFurnitureHomePageVirtualShowroomSection";
import { siteFont } from "@/lib/fonts";

export function NesttFurnitureHomePage() {
  return <div className={`${siteFont.className} relative overflow-x-clip bg-white text-[var(--color-ink)]`}><main><HeroSection /><NesttFurnitureHomePageFurnitureExperienceSection /><NesttFurnitureHomePageRoomShoppingSection /><Suspense fallback={null}><NesttFurnitureHomePageCategoryShoppingSection /></Suspense><Suspense fallback={null}><NesttFurnitureHomePageRecommendedProductsSection /></Suspense><NesttFurnitureHomePageHardwoodPromotionSection /><Suspense fallback={null}><NesttFurnitureHomePageFreshArrivalsSection /></Suspense><NesttFurnitureHomePageVirtualShowroomSection /><NesttFurnitureHomePageRoomFitSection /><NesttFurnitureHomePageServiceBenefitsSection /><NesttFurnitureHomePageTestimonialsSection /><NesttFurnitureHomePageDesignCircleSection /></main><NesttFurnitureHomePageFooter /></div>;
}
