export type CatalogRecord = {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  description?: string;
  parent?: string;
  productCardMode?: "One product" | "One variant";
  sortOrder?: number;
  isPopular?: boolean;
  type?: "Dropdown" | "Box" | "Color";
  options?: string[];
  showInFilter?: boolean;
  showOnProductCard?: boolean;
  cardDisplayType?: "Chip" | "Swatch" | "Text";
  cardMaxOptions?: number;
  unit?: string;
  isComparable?: boolean;
  verified?: boolean;
  logo?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  productCount?: number;
  sku?: string;
  category?: string;
  brand?: string;
  price?: number;
  stock?: number;
  status?: string;
  createdAt?: string;
};

export const demoCategories: CatalogRecord[] = [
  { id: "CAT-001", name: "Living Room", slug: "living-room", isPublished: true, productCount: 28, isPopular: true, sortOrder: 1, productCardMode: "One product", description: "Furniture and accents for relaxed living.", createdAt: "2026-10-18T09:30:00" },
  { id: "CAT-002", name: "Sofas & Sectionals", slug: "sofas-sectionals", isPublished: true, productCount: 12, parent: "Living Room", sortOrder: 1, productCardMode: "One variant", createdAt: "2026-10-17T14:10:00" },
  { id: "CAT-003", name: "Bedroom", slug: "bedroom", isPublished: true, productCount: 19, isPopular: true, sortOrder: 2, productCardMode: "One product", createdAt: "2026-10-14T11:25:00" },
  { id: "CAT-004", name: "Lighting", slug: "lighting", isPublished: false, productCount: 8, sortOrder: 4, productCardMode: "One product", createdAt: "2026-10-12T16:45:00" },
  { id: "CAT-005", name: "Dining", slug: "dining", isPublished: true, productCount: 14, isPopular: false, sortOrder: 3, productCardMode: "One product", createdAt: "2026-10-09T10:00:00" },
];

export const demoAttributes: CatalogRecord[] = [
  { id: "ATR-001", name: "Color", slug: "color", isPublished: true, type: "Color", options: ["Natural oak", "Sage", "Charcoal", "Warm white"], productCount: 42, showInFilter: true, showOnProductCard: true, cardDisplayType: "Swatch", cardMaxOptions: 4, createdAt: "2026-10-21T13:05:00" },
  { id: "ATR-002", name: "Material", slug: "material", isPublished: true, type: "Dropdown", options: ["Solid oak", "Linen blend", "Bouclé", "Powder-coated steel"], productCount: 31, showInFilter: true, showOnProductCard: true, cardDisplayType: "Chip", cardMaxOptions: 3, isComparable: true, createdAt: "2026-10-20T12:20:00" },
  { id: "ATR-003", name: "Size", slug: "size", isPublished: true, type: "Box", options: ["Small", "Medium", "Large"], productCount: 18, showInFilter: true, showOnProductCard: true, cardDisplayType: "Text", cardMaxOptions: 3, createdAt: "2026-10-15T09:15:00" },
  { id: "ATR-004", name: "Finish", slug: "finish", isPublished: false, type: "Dropdown", options: ["Matte", "Satin", "Natural"], productCount: 9, showInFilter: false, createdAt: "2026-10-11T16:50:00" },
];

export const demoBrands: CatalogRecord[] = [
  { id: "BR-001", name: "Nestt Studio", slug: "nestt-studio", isPublished: true, verified: true, productCount: 18, description: "Thoughtful forms for everyday living.", createdAt: "2026-10-23T12:30:00" },
  { id: "BR-002", name: "Haven House", slug: "haven-house", isPublished: true, verified: true, productCount: 12, description: "Warm, considered furniture made to last.", createdAt: "2026-10-18T14:05:00" },
  { id: "BR-003", name: "Form & Field", slug: "form-field", isPublished: true, verified: false, productCount: 9, description: "Modern essentials with honest materials.", createdAt: "2026-10-12T10:45:00" },
  { id: "BR-004", name: "Morrow Living", slug: "morrow-living", isPublished: false, verified: false, productCount: 4, description: "Quiet design for slower mornings.", createdAt: "2026-10-08T09:20:00" },
];

export const demoProducts: CatalogRecord[] = [
  { id: "PR-1084", name: "Haven 3-seat sofa", sku: "NT-SF-204", slug: "haven-3-seat-sofa", category: "Sofas & Sectionals", brand: "Haven House", price: 34800, stock: 12, isPublished: true, status: "Published" },
  { id: "PR-1083", name: "Forma lounge chair", sku: "NT-CH-113", slug: "forma-lounge-chair", category: "Living Room", brand: "Form & Field", price: 12900, stock: 7, isPublished: true, status: "Published" },
  { id: "PR-1082", name: "Oakline side table", sku: "NT-TB-026", slug: "oakline-side-table", category: "Living Room", brand: "Nestt Studio", price: 7850, stock: 24, isPublished: true, status: "Published" },
  { id: "PR-1081", name: "Luma bedside pair", sku: "NT-BD-018", slug: "luma-bedside-pair", category: "Bedroom", brand: "Morrow Living", price: 17600, stock: 5, isPublished: true, status: "Published" },
  { id: "PR-1080", name: "Morrow dining set", sku: "NT-DN-080", slug: "morrow-dining-set", category: "Dining", brand: "Morrow Living", price: 24900, stock: 0, isPublished: false, status: "Draft" },
  { id: "PR-1079", name: "Arlo accent stool", sku: "NT-ST-012", slug: "arlo-accent-stool", category: "Living Room", brand: "Nestt Studio", price: 6400, stock: 18, isPublished: true, status: "Published" },
  { id: "PR-1078", name: "Arc floor lamp", sku: "NT-LP-041", slug: "arc-floor-lamp", category: "Lighting", brand: "Form & Field", price: 11200, stock: 3, isPublished: false, status: "Draft" },
  { id: "PR-1077", name: "Rill oak coffee table", sku: "NT-TB-055", slug: "rill-oak-coffee-table", category: "Living Room", brand: "Haven House", price: 15400, stock: 15, isPublished: true, status: "Published" },
];
