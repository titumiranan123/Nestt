import { NesttFurnitureHomePageCategoryShoppingSection } from "./NesttFurnitureHomePageCategoryShoppingSection";
import { NesttFurnitureHomePageDesignCircleSection } from "./NesttFurnitureHomePageDesignCircleSection";
import { NesttFurnitureHomePageFooter } from "./NesttFurnitureHomePageFooter";
import { NesttFurnitureHomePageFurnitureExperienceSection } from "./NesttFurnitureHomePageFurnitureExperienceSection";
import { NesttFurnitureHomePageHardwoodPromotionSection } from "./NesttFurnitureHomePageHardwoodPromotionSection";
import { Navbar } from "@/components/navigation/Navbar";
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
  return <div className={`${siteFont.className} relative overflow-x-clip bg-white text-[var(--color-ink)]`}><Navbar variant="hero" /><main><HeroSection /><NesttFurnitureHomePageFurnitureExperienceSection /><NesttFurnitureHomePageRoomShoppingSection /><NesttFurnitureHomePageCategoryShoppingSection /><NesttFurnitureHomePageRecommendedProductsSection /><NesttFurnitureHomePageHardwoodPromotionSection /><NesttFurnitureHomePageFreshArrivalsSection /><NesttFurnitureHomePageVirtualShowroomSection /><NesttFurnitureHomePageRoomFitSection /><NesttFurnitureHomePageServiceBenefitsSection /><NesttFurnitureHomePageTestimonialsSection /><NesttFurnitureHomePageDesignCircleSection /></main><NesttFurnitureHomePageFooter /></div>;
}
