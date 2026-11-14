import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { UpsertARProductAsset } from './dto/ar-product-asset.schemas.js';
import type {
  CreateProduct,
  CreateProductVariant,
  UpdateProduct,
  UpdateProductVariant,
} from './dto/create-product.schemas.js';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
  },
};

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 255) || 'item';

type ARAssetRow = {
  id: string;
  variantId: string;
  modelUrl: string;
  dimensionsMm: unknown;
  placement: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const createVariantData = (input: CreateProductVariant) => {
  const { slug, ...data } = input;
  return {
    ...data,
    slug: slug ?? `${slugify(input.name)}-${slugify(input.sku)}`,
  };
};

const updateVariantData = (input: UpdateProductVariant) => {
  const { slug, ...data } = input;
  return { ...data, ...(slug !== undefined ? { slug } : {}) };
};

@Injectable()
export class ProductsService {
  constructor(private readonly db: PrismaService) {}

  async getARAsset(variantId: string) {
    const [asset] = await this.db.$queryRaw<ARAssetRow[]>`
      SELECT "id", "variantId", "modelUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt"
      FROM "ar_product_assets"
      WHERE "variantId" = ${variantId}::uuid
      LIMIT 1
    `;
    if (!asset) throw new NotFoundException('AR asset not found');
    return asset;
  }

  async upsertARAsset(variantId: string, input: UpsertARProductAsset) {
    const variant = await this.db.productVariant.findFirst({
      where: { id: variantId, deletedAt: null },
      select: { id: true },
    });
    if (!variant) throw new NotFoundException('Product variant not found');

    const [asset] = await this.db.$queryRaw<ARAssetRow[]>`
      INSERT INTO "ar_product_assets" ("id", "variantId", "modelUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${variantId}::uuid, ${input.modelUrl}, ${JSON.stringify(input.dimensionsMm)}::jsonb, ${input.placement}, ${input.isPublished}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("variantId") DO UPDATE SET
        "modelUrl" = EXCLUDED."modelUrl",
        "dimensionsMm" = EXCLUDED."dimensionsMm",
        "placement" = EXCLUDED."placement",
        "isPublished" = EXCLUDED."isPublished",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "variantId", "modelUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt"
    `;
    return asset;
  }

  listPublic() {
    return this.db.product.findMany({
      where: { status: 'active', deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: 'active', deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async getPublicBySlug(slug: string) {
    const product = await this.db.product.findFirst({
      where: { slug, status: 'active', deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: 'active', deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  listAdmin() {
    return this.db.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: productInclude,
    });
  }

  async getProduct(id: string) {
    const product = await this.db.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(input: CreateProduct) {
    const { variants, isPublished, ...productInput } = input;
    const status = productInput.status ?? (isPublished === undefined ? undefined : isPublished ? 'active' : 'draft');
    const data: Prisma.ProductUncheckedCreateInput = {
      ...productInput,
      slug: productInput.slug ?? slugify(productInput.name),
      ...(status ? { status } : {}),
      ...(variants
        ? {
            variants: {
              create: variants.map((variant) => ({
                ...createVariantData(variant),
              })),
            },
          }
        : {}),
    };
    return this.db.product.create({ data, include: productInclude });
  }

  async updateProduct(id: string, input: UpdateProduct) {
    await this.getProduct(id);
    const { isPublished, ...productInput } = input;
    const status = productInput.status ?? (isPublished === undefined ? undefined : isPublished ? 'active' : 'draft');
    const data: Prisma.ProductUncheckedUpdateInput = {
      ...productInput,
      ...(status ? { status } : {}),
    };
    return this.db.product.update({ where: { id }, data, include: productInclude });
  }

  async removeProduct(id: string) {
    await this.getProduct(id);
    await this.db.product.update({ where: { id }, data: { deletedAt: new Date() } });
    return { id, deleted: true };
  }

  async listVariants(productId: string) {
    await this.getProduct(productId);
    return this.db.productVariant.findMany({
      where: { productId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getVariant(productId: string, variantId: string) {
    await this.getProduct(productId);
    const variant = await this.db.productVariant.findFirst({
      where: { id: variantId, productId, deletedAt: null },
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    return variant;
  }

  async createVariant(productId: string, input: CreateProductVariant) {
    await this.getProduct(productId);
    return this.db.productVariant.create({
      data: {
        ...createVariantData(input),
        productId,
      },
    });
  }

  async updateVariant(productId: string, variantId: string, input: UpdateProductVariant) {
    await this.getVariant(productId, variantId);
    return this.db.productVariant.update({
      where: { id: variantId },
      data: updateVariantData(input),
    });
  }

  async removeVariant(productId: string, variantId: string) {
    await this.getVariant(productId, variantId);
    await this.db.productVariant.update({ where: { id: variantId }, data: { deletedAt: new Date() } });
    return { id: variantId, deleted: true };
  }
}
