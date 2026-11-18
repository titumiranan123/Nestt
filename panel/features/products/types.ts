export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type VariantStatus = "draft" | "active" | "inactive";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";
export type UseEnvironment = "indoor" | "outdoor";
export type SpecificationItemType = "TEXT" | "NUMBER" | "BOOLEAN";

export type ProductSpecificationItemInput = {
  label: string;
  value: string;
  type?: SpecificationItemType;
  href?: string | null;
  sortOrder?: number;
};

export type ProductSpecificationInput = {
  title?: string;
  image?: string | null;
  sortOrder?: number;
  specs: ProductSpecificationItemInput[];
};

export type ProductCareItem = {
  id: string;
  productId: string;
  title: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ProductCareItemInput = {
  title: string;
  description?: string | null;
  displayOrder?: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  status: VariantStatus;
  sortOrder: number;
  isDefault: boolean;
  stockQty: number;
  lowStockAlertQty: number;
  stockStatus: StockStatus;
  price: string | number;
  isOnSale: boolean;
  costPrice: string | number | null;
  requiresWhiteGlove: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  features: string[];
  specification: ProductSpecificationInput | null;
  variantOptions: ProductVariantOption[];
  media: ProductMedia[];
};

export type ProductVariantOption = {
  id?: string;
  variantId?: string;
  attributeId: string;
  attributeOptionId: string;
  displayValue: string | null;
  displayImage: string | null;
  sortOrder: number;
};

export type ProductMedia = {
  id?: string;
  variantId?: string;
  url: string;
  type: "product" | "image" | "video";
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
  videoUrl?: string | null;
  videoThumbnailUrl?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  brandId: string | null;
  brand?: { id: string; name: string; slug: string } | null;
  description: string | null;
  useEnvironment: UseEnvironment;
  status: ProductStatus;
  sortOrder: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isContractGrade: boolean;
  isCustomizable: boolean;
  isPriceOnRequest: boolean;
  customizableTextNote: string | null;
  assemblyRequired: boolean;
  assemblyDuration: number | null;
  assemblyPdfUrl: string | null;
  guaranteeDays: number | null;
  guaranteeLabel: string | null;
  guaranteeUrl: string | null;
  features: string[];
  careItems: ProductCareItem[];
  specification: ProductSpecificationInput | null;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
};

export type ProductCategory = { id: string; name: string; slug: string; parentId: string | null; isPublished?: boolean };
export type ProductBrand = { id: string; name: string; slug: string; isPublished: boolean };

export type ProductVariantInput = {
  name: string;
  slug?: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  status?: VariantStatus;
  sortOrder?: number;
  isDefault?: boolean;
  stockQty?: number;
  lowStockAlertQty?: number;
  stockStatus?: StockStatus;
  price: number;
  isOnSale?: boolean;
  costPrice?: number | null;
  requiresWhiteGlove?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  features?: string[];
  specification?: ProductSpecificationInput;
  variantOptions?: ProductVariantOption[];
  media?: ProductMedia[];
};

export type ProductInput = {
  name: string;
  slug?: string;
  tags?: string[];
  categoryId: string;
  brandId?: string | null;
  description?: string | null;
  useEnvironment?: UseEnvironment;
  status?: ProductStatus;
  sortOrder?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isContractGrade?: boolean;
  isCustomizable?: boolean;
  isPriceOnRequest?: boolean;
  customizableTextNote?: string | null;
  assemblyRequired?: boolean;
  assemblyDuration?: number | null;
  assemblyPdfUrl?: string | null;
  guaranteeDays?: number | null;
  guaranteeLabel?: string | null;
  guaranteeUrl?: string | null;
  features?: string[];
  careItems?: ProductCareItemInput[];
  specification?: ProductSpecificationInput;
  variants?: ProductVariantInput[];
};
