import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getPublicSeoMetadata, seoRobots, seoTwitterCard } from "@/lib/seo";
import { CartProvider } from "@/components/cart/CartProvider";
import { Navbar } from "@/components/navigation/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPublicSeoMetadata("home");
  const title = seo?.metaTitle ?? "Thoughtful Furniture for Everyday Living | Nestt";
  const description = seo?.metaDescription ?? "Explore thoughtfully designed sofas, beds, dining tables, chairs and storage at Nestt. Find comfortable furniture and room inspiration for your home in Bangladesh.";
  return {
    title,
    description,
    keywords: seo?.metaKeywords?.split(",").map((keyword) => keyword.trim()).filter(Boolean),
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    robots: seoRobots(seo?.metaRobots ?? null),
    openGraph: { title, description, type: "website", url: seo?.canonicalUrl ?? undefined, siteName: "Nestt" },
    twitter: { card: seoTwitterCard(seo?.twitterCardType ?? null), title, description },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full bg-[var(--color-cream)] font-sans text-[var(--color-ink)]">
        <CartProvider>
          <Navbar />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
