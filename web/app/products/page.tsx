import type { Metadata } from "next";
import { ProductsListingPage } from "@/components/products/ProductsListingPage";

export const metadata: Metadata = {
  title: "Shop Furniture | Nestt",
  description: "Shop sofas, chairs, tables, beds, storage and thoughtful furniture for everyday living.",
};

export default function ProductsRoute() {
  return <ProductsListingPage />;
}
