export type NavigationLink = { label: string; href: string; description?: string };
export type NavigationGroup = { title: string; links: NavigationLink[] };
export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  groups: NavigationGroup[];
  feature: { image: string; eyebrow: string; title: string; description: string; cta: string; href: string };
};

export const navigationItems: NavigationItem[] = [
  {
    id: "products", label: "Products", href: "/products",
    groups: [
      { title: "Shop furniture", links: [
        { label: "Sofas & sectionals", href: "/products?category=sofas-sectionals" }, { label: "Beds & bed frames", href: "/products?category=beds-bedroom" },
        { label: "Dining & coffee tables", href: "/products?category=tables" }, { label: "Chairs & recliners", href: "/products?category=chairs-ottomans" },
        { label: "Storage & sideboards", href: "/products?category=storage-cabinets" }, { label: "Decor & accessories", href: "/products?category=rugs-decor" },
      ] },
      { title: "Discover more", links: [
        { label: "New arrivals", href: "/#fresh-arrivals", description: "The latest pieces for your home" },
        { label: "Bestsellers", href: "/#recommended", description: "Loved in homes like yours" },
        { label: "Shop by room", href: "/#rooms", description: "Find pieces that work together" },
      ] },
    ],
    feature: { image: "/assets/hero/quality-living-room.webp", eyebrow: "Made for everyday living", title: "Make room for comfort.", description: "Thoughtful pieces. A home that feels like you.", cta: "Explore the collection", href: "/products" },
  },
  {
    id: "rooms", label: "Rooms", href: "/#rooms",
    groups: [
      { title: "Your space, reimagined", links: [ { label: "Living room", href: "/#rooms" }, { label: "Bedroom", href: "/#rooms" }, { label: "Dining room", href: "/#rooms" }, { label: "Home office", href: "/#rooms" } ] },
      { title: "Find your style", links: [ { label: "Japandi Modern", href: "/#more", description: "Calm spaces, natural materials" }, { label: "Mid-Century Modern", href: "/#more", description: "Timeless shapes with character" }, { label: "Urban Minimalism", href: "/#more", description: "Less clutter, more possibility" } ] },
    ],
    feature: { image: "/assets/hero/nestt-hero-living.png", eyebrow: "Room inspiration", title: "A little inspiration. A whole new room.", description: "Find furniture for every corner of your home.", cta: "Shop by room", href: "/#rooms" },
  },
  {
    id: "inspiration", label: "Inspiration", href: "/#inspiration",
    groups: [
      { title: "See the possibilities", links: [ { label: "See every detail", href: "/#inspiration" }, { label: "See it in your space", href: "/#inspiration" }, { label: "Explore styled rooms", href: "/#more" } ] },
      { title: "Make it yours", links: [ { label: "Find your style", href: "/#more", description: "Ideas that fit the way you live" }, { label: "Visit the virtual showroom", href: "/#showrooms", description: "Discover furniture from home" }, { label: "Join the Design Circle", href: "/#newsletter", description: "Fresh ideas, straight to your inbox" } ] },
    ],
    feature: { image: "/assets/banners/nestt-hardwood-promotion.png", eyebrow: "Considered spaces", title: "Ideas to bring your home to life.", description: "Discover warm textures and thoughtful combinations.", cta: "Get inspired", href: "/#inspiration" },
  },
  {
    id: "popular", label: "Popular", href: "/#recommended",
    groups: [
      { title: "Customer favourites", links: [ { label: "Bestselling furniture", href: "/#recommended" }, { label: "Favourite lounge chairs", href: "/#recommended" }, { label: "Dining essentials", href: "/#recommended" }, { label: "Bedroom favourites", href: "/#recommended" } ] },
      { title: "Why Nestt", links: [ { label: "Quality you can feel", href: "/#home", description: "Designed for daily life" }, { label: "Explore every detail", href: "/#inspiration", description: "Take a closer look before you buy" }, { label: "New favourites", href: "/#fresh-arrivals", description: "Meet our latest releases" } ] },
    ],
    feature: { image: "/assets/hero/living-room-preview.webp", eyebrow: "Loved for a reason", title: "Your next favourite piece.", description: "Discover the collection our customers come back for.", cta: "Shop bestsellers", href: "/#recommended" },
  },
  {
    id: "offers", label: "Offers", href: "/#fresh-arrivals",
    groups: [
      { title: "Discover the offers", links: [ { label: "Crafted hardwood essentials", href: "/#fresh-arrivals" }, { label: "Selected furniture offers", href: "/#recommended" }, { label: "Fresh arrivals", href: "/#fresh-arrivals" } ] },
      { title: "Explore collections", links: [ { label: "Dining & entertaining", href: "/#products" }, { label: "Storage for every space", href: "/#products" }, { label: "Comfort for your living room", href: "/#rooms" } ] },
    ],
    feature: { image: "/assets/banners/nestt-hardwood-promotion.png", eyebrow: "Crafted hardwood essentials", title: "Natural warmth. Considered value.", description: "Explore the current collections and offers.", cta: "Explore offers", href: "/#fresh-arrivals" },
  },
  {
    id: "showrooms", label: "Showrooms", href: "/#showrooms",
    groups: [
      { title: "Step inside", links: [ { label: "Virtual showroom", href: "/#showrooms" }, { label: "Explore our rooms", href: "/#rooms" }, { label: "See furniture in your space", href: "/#inspiration" } ] },
      { title: "Here to help", links: [ { label: "Talk to our team", href: "mailto:hello@nestt.home", description: "Advice for your next space" }, { label: "Find your style", href: "/#more", description: "Discover what feels like home" } ] },
    ],
    feature: { image: "/assets/hero/quality-living-room.webp", eyebrow: "The Nestt experience", title: "Your next space starts here.", description: "Take a look around, wherever you are.", cta: "Enter the showroom", href: "/#showrooms" },
  },
  {
    id: "more", label: "More", href: "/#more",
    groups: [
      { title: "Explore Nestt", links: [ { label: "Our furniture", href: "/#products" }, { label: "Room inspiration", href: "/#rooms" }, { label: "The Design Circle", href: "/#newsletter" } ] },
      { title: "Let’s find your fit", links: [ { label: "Find your style", href: "/#more", description: "Furniture that feels right for you" }, { label: "Contact us", href: "mailto:hello@nestt.home", description: "We’re here to help" }, { label: "See what’s new", href: "/#fresh-arrivals", description: "Fresh designs for everyday living" } ] },
    ],
    feature: { image: "/assets/hero/nestt-hero-living.png", eyebrow: "A home that feels like you", title: "Good design starts with a conversation.", description: "Stay inspired with new ideas and collections.", cta: "Join the Design Circle", href: "/#newsletter" },
  },
];
