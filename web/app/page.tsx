import { NesttFurnitureHomePage } from "@/components/home-page/NesttFurnitureHomePage";
import { SeoStructuredData } from "@/components/SeoStructuredData";
import { getPublicSeoMetadata } from "@/lib/seo";

export default async function Home() {
  const seo = await getPublicSeoMetadata("home");
  return <><SeoStructuredData content={seo?.schema ?? null}/><NesttFurnitureHomePage /></>;
}
