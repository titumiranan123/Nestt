export type HomePageImageCard = {
  title: string;
  description: string;
  image: string;
  action: string;
};

export type HomePageProduct = {
  name: string;
  category: string;
  price: string;
  oldPrice?: string;
  image: string;
  badge: string;
  detail?: string;
  reviewCount?: number;
};

export const homePageRoomLinks = [
  { name: "Living Room", image: "/assets/figma-home/room-living.png" },
  { name: "Bedroom", image: "/assets/figma-home/room-bedroom.png" },
  { name: "Dining Room", image: "/assets/figma-home/room-dining.png" },
  { name: "Home Office", image: "/assets/figma-home/room-office.png" },
];

export const homePageCategoryLinks = [
  { name: "Sofas", image: "/assets/figma-home/category-sofas.png", count: "52 Models" },
  { name: "Beds", image: "/assets/figma-home/category-beds.png", count: "36 Models" },
  { name: "Tables", image: "/assets/figma-home/category-tables.png", count: "44 Models" },
  { name: "Chairs", image: "/assets/figma-home/category-chairs.png", count: "68 Models" },
  { name: "Storage", image: "/assets/figma-home/category-storage.png", count: "31 Models" },
  { name: "Decor", image: "/assets/figma-home/category-decor.png", count: "82 Models" },
];

export const recommendedHomePageProducts: HomePageProduct[] = [
  { name: "Oslo High-Back Recliner", category: "Lounge seating", price: "৳ 48,500", image: "/assets/figma-home/product-oslo.png", badge: "Trending Lounge Chair", detail: "Ergonomic Comfort", reviewCount: 128 },
  { name: "Kyoto Extendable Dining Table", category: "Dining tables", price: "৳ 62,000", image: "/assets/figma-home/product-kyoto.png", badge: "Solid Beech Joinery", detail: "Solid Beech Joinery", reviewCount: 128 },
  { name: "Sylvan Hydraulic King Bed", category: "Beds & bed frames", price: "৳ 94,000", image: "/assets/figma-home/product-sylvan.png", badge: "Bestseller Bedroom", detail: "Hydraulic Storage", reviewCount: 128 },
  { name: "Arcus Fluted Timber Credenza", category: "Storage & cabinets", price: "৳ 56,000", image: "/assets/figma-home/product-arcus.png", badge: "Architectural Storage", detail: "Soft-Close German Rails", reviewCount: 92 },
];

export const freshArrivalHomePageProducts: HomePageProduct[] = [
  { name: "Vanguard Modular Sectional", category: "Living room", price: "৳ 1,18,000", oldPrice: "৳ 1,35,000", image: "/assets/figma-home/fresh-vanguard.png", badge: "New Arrival" },
  { name: "Aero Bentwood Occasional Chair", category: "Accent chairs", price: "৳ 32,500", oldPrice: "৳ 37,000", image: "/assets/figma-home/fresh-aero.png", badge: "New Arrival" },
  { name: "Krona Smart Study Desk", category: "Home office", price: "৳ 41,000", oldPrice: "৳ 47,000", image: "/assets/figma-home/fresh-krona.png", badge: "New Arrival" },
];

export const homePageExperienceCards: HomePageImageCard[] = [
  { title: "See Every Detail", description: "Explore every detail, visualize furniture in your space, and discover your perfect fit before you buy.", image: "/assets/figma-home/feature-detail.png", action: "Explore" },
  { title: "See It in Your Space", description: "Visualize furniture in your room before making a decision.", image: "/assets/figma-home/feature-ar.png", action: "Try AR" },
  { title: "Step Into Your Dream Home", description: "Explore an immersive virtual showroom from anywhere.", image: "/assets/figma-home/feature-showroom.png", action: "Explore" },
  { title: "We're Here to Help", description: "Get expert advice and answers to your questions in real time.", image: "/assets/figma-home/feature-help.png", action: "Explore" },
];

export const homePageFitSpaces = [
  { name: "Japandi Modern", description: "Low profile & blonde beech", image: "/assets/figma-home/fit-japandi.png" },
  { name: "Mid-Century Modern", description: "Dark oak & cognac saddle leather", image: "/assets/figma-home/fit-midcentury.png" },
  { name: "Urban Minimalist", description: "Clean geometry & woven linen", image: "/assets/figma-home/fit-minimal.png" },
];

export const homePageServiceBenefits = [
  { title: "White-Glove Assembly", description: "Nationwide delivery with hassle-free installation by certified Nestt technicians." },
  { title: "Easy 14-Day Returns", description: "Evaluate scale in your actual setting. If it doesn’t align, enjoy a quick pickup and support." },
  { title: "0% EMI Financing", description: "Convenient zero-interest monthly installment up to 24 months through 35+ partner banks." },
  { title: "10-Year Warranty", description: "Guaranteed protection against solid wood seasoning defects, pest infestation, and joint failure." },
];

export const homePageTestimonials = [
  { quote: "The robotic joinery on the Kyoto extendable dining table is flawless. You cannot see or feel any gaps. Delivery team in Gulshan completed setup in under 20 minutes.", name: "Tarik Siddiqui", location: "Architect · Studio Architect" },
  { quote: "Tested our living room layout using Nestt’s WebAR feature beforehand. When the actual Sylvan hydraulic bed and sofa arrived, the scale and timber tone matched 1:1.", name: "Nadia Mansoor", location: "Banasree Residence, Dhaka" },
  { quote: "Nestt defines modern furniture excellence in the country. Four years after purchase, our executive writing desk still looks crisp, sturdy, and immaculate.", name: "Rehan Ahmed", location: "Design Director · Minimalist Labs" },
];
