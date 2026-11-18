import { z } from 'zod';

const slugSchema = z.string().trim().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i);
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const moneySchema = z.union([
  z.number().finite().nonnegative(),
  z.string().regex(/^\d{1,10}(\.\d{1,2})?$/),
]);
const specificationItemSchema = z.strictObject({
  label: z.string().trim().min(1).max(255),
  value: z.string().trim().min(1),
  type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN']).optional(),
  href: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().default(0),
});
const specificationSchema = z.strictObject({
  title: z.string().trim().min(1).max(255).optional(),
  image: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().default(0),
  specs: z.array(specificationItemSchema).max(100),
});
const productCareItemSchema = z.strictObject({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
});

const variantOptionSchema = z.strictObject({
  attributeId: z.uuid(),
  attributeOptionId: z.uuid(),
  displayValue: nullableText(500),
  displayImage: nullableText(1000),
  sortOrder: z.number().int().default(0),
});

const productMediaSchema = z.strictObject({
  url: z.url().max(1000),
  type: z.enum(['product', 'image', 'video']).default('product'),
  alt: nullableText(500),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().default(0),
  videoUrl: z.url().max(1000).nullable().optional(),
  videoThumbnailUrl: z.url().max(1000).nullable().optional(),
});

export const createProductVariantSchema = z.strictObject({
  name: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(),
  sku: z.string().trim().min(1).max(100),
  barcode: nullableText(255),
  description: z.string().trim().nullable().optional(),
  status: z.enum(['active', 'inactive', 'draft']).optional(),
  sortOrder: z.number().int().default(0),
  isDefault: z.boolean().optional(),
  stockQty: z.number().int().min(0).max(1_000_000).optional(),
  lowStockAlertQty: z.number().int().min(0).max(1_000_000).optional(),
  stockStatus: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'PREORDER']).optional(),
  price: moneySchema,
  isOnSale: z.boolean().optional(),
  costPrice: moneySchema.nullable().optional(),
  requiresWhiteGlove: z.boolean().optional(),
  metaTitle: nullableText(255),
  metaDescription: z.string().trim().nullable().optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  specification: specificationSchema.optional(),
  variantOptions: z.array(variantOptionSchema).max(50).optional(),
  media: z.array(productMediaSchema).max(100).optional(),
});

export const updateProductVariantSchema = createProductVariantSchema.partial();

export const createProductSchema = z.strictObject({
  name: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  categoryId: z.uuid(),
  brandId: z.uuid().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  useEnvironment: z.enum(['indoor', 'outdoor']).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  /** Compatibility input for clients that still submit isPublished. */
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().default(0),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isContractGrade: z.boolean().optional(),
  isCustomizable: z.boolean().optional(),
  isPriceOnRequest: z.boolean().optional(),
  customizableTextNote: z.string().trim().nullable().optional(),
  assemblyRequired: z.boolean().optional(),
  assemblyDuration: z.number().int().min(0).nullable().optional(),
  assemblyPdfUrl: z.url().max(1000).nullable().optional(),
  guaranteeDays: z.number().int().min(0).nullable().optional(),
  guaranteeLabel: nullableText(255),
  guaranteeUrl: z.url().max(1000).nullable().optional(),
  features: z.array(z.string().trim().min(1)).optional(),
  careItems: z.array(productCareItemSchema).max(100).optional(),
  specification: specificationSchema.optional(),
  variants: z.array(createProductVariantSchema).max(100).optional(),
});

export const updateProductSchema = createProductSchema.omit({ variants: true }).partial();

export type CreateProductVariant = z.infer<typeof createProductVariantSchema>;
export type UpdateProductVariant = z.infer<typeof updateProductVariantSchema>;
export type ProductSpecificationInput = z.infer<typeof specificationSchema>;
export type ProductCareItemInput = z.infer<typeof productCareItemSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
