import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import type { UpsertARProductAsset } from './dto/ar-product-asset.schemas.js';
import type {
  CreateProduct,
  CreateProductVariant,
  ProductSpecificationInput,
  ProductCareItemInput,
  UpdateProduct,
  UpdateProductVariant,
} from './dto/create-product.schemas.js';

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  careItems: { orderBy: { displayOrder: 'asc' as const } },
  specification: {
    include: { specs: { orderBy: [{ sortOrder: 'asc' as const }, { label: 'asc' as const }] } },
  },
  variants: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
    include: {
      media: { orderBy: [{ displayOrder: 'asc' as const }, { createdAt: 'asc' as const }] },
      variantOptions: { orderBy: [{ sortOrder: 'asc' as const }] },
      specification: {
        include: { specs: { orderBy: [{ sortOrder: 'asc' as const }, { label: 'asc' as const }] } },
      },
    },
  },
};

const storefrontProductCardSelect = {
  id: true,
  name: true,
  slug: true,
  avgRating: true,
  totalReviews: true,
  isPriceOnRequest: true,
  isNewArrival: true,
  category: { select: { id: true, name: true, slug: true } },
  variants: {
    where: { status: 'active', deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    take: 1,
    select: {
      id: true, name: true, price: true, isDefault: true,
      media: {
        where: { type: { not: 'video' } },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
        take: 1,
        select: { url: true, alt: true, type: true, isPrimary: true },
      },
    },
  },
} satisfies Prisma.ProductSelect;

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
  usdzUrl: string | null;
  dimensionsMm: unknown;
  placement: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const createVariantData = (input: CreateProductVariant) => {
  const { slug, specification: _specification, variantOptions: _variantOptions, media: _media, ...data } = input;
  return {
    ...data,
    slug: slug ?? `${slugify(input.name)}-${slugify(input.sku)}`,
  };
};

const updateVariantData = (input: UpdateProductVariant) => {
  const { slug, specification: _specification, variantOptions: _variantOptions, media: _media, ...data } = input;
  return { ...data, ...(slug !== undefined ? { slug } : {}) };
};

const createVariantRelations = (input: CreateProductVariant) => ({
  ...(input.variantOptions?.length ? { variantOptions: { create: input.variantOptions } } : {}),
  ...(input.media?.length ? { media: { create: input.media } } : {}),
});

const createSpecificationData = (input: ProductSpecificationInput) => ({
  title: input.title ?? 'Specifications',
  image: input.image ?? null,
  sortOrder: input.sortOrder ?? 0,
  specs: {
    create: input.specs.map((spec) => ({
      ...spec,
      type: spec.type ?? 'TEXT',
      sortOrder: spec.sortOrder ?? 0,
    })),
  },
});

@Injectable()
export class ProductsService {
  constructor(private readonly db: PrismaService) {}

  async getARAsset(variantId: string) {
    const [asset] = await this.db.$queryRaw<ARAssetRow[]>`
      SELECT "id", "variantId", "modelUrl", "usdzUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt"
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
      INSERT INTO "ar_product_assets" ("id", "variantId", "modelUrl", "usdzUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${variantId}::uuid, ${input.modelUrl}, ${input.usdzUrl ?? null}, ${JSON.stringify(input.dimensionsMm)}::jsonb, ${input.placement}, ${input.isPublished}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("variantId") DO UPDATE SET
        "modelUrl" = EXCLUDED."modelUrl",
        "usdzUrl" = CASE
          WHEN ${input.usdzUrl !== undefined} OR "ar_product_assets"."modelUrl" <> EXCLUDED."modelUrl" THEN EXCLUDED."usdzUrl"
          ELSE "ar_product_assets"."usdzUrl"
        END,
        "dimensionsMm" = EXCLUDED."dimensionsMm",
        "placement" = EXCLUDED."placement",
        "isPublished" = EXCLUDED."isPublished",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "variantId", "modelUrl", "usdzUrl", "dimensionsMm", "placement", "isPublished", "createdAt", "updatedAt"
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
        careItems: { orderBy: { displayOrder: 'asc' } },
        specification: {
          include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
        },
        variants: {
          where: { status: 'active', deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
            variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
            specification: {
              include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
            },
          },
        },
      },
    });
  }

  listRecommended() {
    return this.db.$transaction(async (tx) => {
      const ranked = await tx.$queryRaw<{ id: string; hasSales: boolean }[]>`
        WITH sales AS (
          SELECT variant."productId", SUM(item.quantity) AS units
          FROM "order_items" AS item
          INNER JOIN "orders" AS customer_order ON customer_order.id = item.order_id
          INNER JOIN "product_variants" AS variant ON variant.id = item.variant_id
          WHERE customer_order.status <> 'CANCELLED'
            AND customer_order.payment_status NOT IN ('FAILED', 'REFUNDED')
            AND (customer_order.status = 'DELIVERED' OR customer_order.payment_status IN ('PAID', 'PARTIALLY_REFUNDED'))
            AND item.quantity > 0
            AND NOT EXISTS (
              SELECT 1
              FROM "order_returns" AS returned
              WHERE returned."orderId" = item.order_id AND returned."itemId" = item.id
                AND returned.status = 'RECEIVED'
            )
          GROUP BY variant."productId"
        )
        SELECT product.id, (sales.units IS NOT NULL) AS "hasSales"
        FROM "products" AS product
        LEFT JOIN sales ON sales."productId" = product.id
        WHERE product.status = 'active' AND product."deletedAt" IS NULL
        ORDER BY sales.units DESC NULLS LAST, product."sortOrder", product.name, product.id
        LIMIT 6
      `;
      const limit = ranked.length === 6 && ranked.every(({ hasSales }) => hasSales) ? 6 : 4;
      const ids = ranked.slice(0, limit).map(({ id }) => id);
      if (!ids.length) return [];

      const products = await tx.product.findMany({
        where: { id: { in: ids } },
        select: storefrontProductCardSelect,
      });
      const byId = new Map(products.map((product) => [product.id, product]));
      return ids.flatMap((id) => {
        const product = byId.get(id);
        return product ? [product] : [];
      });
    }, { isolationLevel: 'RepeatableRead' });
  }

  listNewArrivals() {
    return this.db.product.findMany({
      where: { status: 'active', deletedAt: null, isNewArrival: true },
      orderBy: [{ createdAt: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
      take: 3,
      select: storefrontProductCardSelect,
    });
  }

  async getPublicBySlug(slug: string) {
    const product = await this.db.product.findFirst({
      where: { slug, status: 'active', deletedAt: null },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        careItems: { orderBy: { displayOrder: 'asc' } },
        pairSources: {
          where: { isActive: true, pairedProduct: { status: 'active', deletedAt: null } },
          orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
          select: {
            heading: true,
            pairedProduct: {
              select: {
                ...storefrontProductCardSelect,
                variants: {
                  ...storefrontProductCardSelect.variants,
                  select: { ...storefrontProductCardSelect.variants.select, stockQty: true, stockStatus: true },
                },
              },
            },
          },
        },
        specification: {
          include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
        },
        variants: {
          where: { status: 'active', deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
            variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
            arAsset: { select: { modelUrl: true, usdzUrl: true, placement: true, isPublished: true } },
            specification: {
              include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
            },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    const optionIds = [...new Set(product.variants.flatMap((variant) =>
      variant.variantOptions.map((option) => option.attributeOptionId),
    ))];
    const options = optionIds.length ? await this.db.attributeOption.findMany({
      where: { id: { in: optionIds } },
      select: { id: true, name: true, value: true, image: true, attribute: { select: { name: true } } },
    }) : [];
    const optionsById = new Map(options.map((option) => [option.id, option]));
    return {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        arAsset: variant.arAsset?.isPublished ? variant.arAsset : null,
        variantOptions: variant.variantOptions.map((option) => {
          const preset = optionsById.get(option.attributeOptionId);
          return {
            ...option,
            attributeName: preset?.attribute.name,
            displayValue: option.displayValue || preset?.name,
            displayImage: option.displayImage || preset?.image,
            swatch: preset?.value && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(preset.value) ? preset.value : undefined,
          };
        }),
      })),
    };
  }

  listAdmin() {
    return this.db.product.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: productInclude,
    });
  }

  listAdminBrands() {
    return this.db.brand.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: 'asc' }],
      select: { id: true, name: true, slug: true, isPublished: true },
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
    const { variants, isPublished, specification, careItems, ...productInput } = input;
    const status = productInput.status ?? (isPublished === undefined ? undefined : isPublished ? 'active' : 'draft');
    for (const variant of variants ?? []) await this.validateVariantOptions(variant.variantOptions);
    const data: Prisma.ProductUncheckedCreateInput = {
      ...productInput,
      slug: productInput.slug ?? slugify(productInput.name),
      ...(status ? { status } : {}),
      ...(careItems?.length
        ? {
            careItems: {
              create: careItems.map((item, index) => ({
                ...item,
                displayOrder: item.displayOrder ?? index,
              })),
            },
          }
        : {}),
      ...(specification?.specs.length
        ? { specification: { create: createSpecificationData(specification) } }
        : {}),
      ...(variants
        ? {
            variants: {
              create: variants.map((variant) => ({
                ...createVariantData(variant),
                ...(variant.specification?.specs.length
                  ? { specification: { create: createSpecificationData(variant.specification) } }
                  : {}),
                ...createVariantRelations(variant),
              })),
            },
          }
        : {}),
    };
    return this.db.product.create({ data, include: productInclude });
  }

  async updateProduct(id: string, input: UpdateProduct) {
    await this.getProduct(id);
    const { isPublished, specification, careItems, ...productInput } = input;
    const status = productInput.status ?? (isPublished === undefined ? undefined : isPublished ? 'active' : 'draft');
    const data: Prisma.ProductUncheckedUpdateInput = {
      ...productInput,
      ...(status ? { status } : {}),
    };
    return this.db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });
      if (careItems !== undefined) {
        await this.replaceCareItems(tx, id, careItems);
      }
      if (specification !== undefined) {
        await this.replaceSpecification(tx, { productId: id }, specification);
      }
      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });
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
      include: {
        media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
        specification: { include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } } },
      },
    });
  }

  async getVariant(productId: string, variantId: string) {
    await this.getProduct(productId);
    const variant = await this.db.productVariant.findFirst({
      where: { id: variantId, productId, deletedAt: null },
      include: {
        media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
        specification: { include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } } },
      },
    });
    if (!variant) throw new NotFoundException('Product variant not found');
    return variant;
  }

  async createVariant(productId: string, input: CreateProductVariant) {
    await this.getProduct(productId);
    await this.validateVariantOptions(input.variantOptions);
    return this.db.productVariant.create({
      data: {
        ...createVariantData(input),
        productId,
        ...createVariantRelations(input),
        ...(input.specification?.specs.length
          ? { specification: { create: createSpecificationData(input.specification) } }
          : {}),
      },
      include: {
        media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
        variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
        specification: { include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } } },
      },
    });
  }

  async updateVariant(productId: string, variantId: string, input: UpdateProductVariant) {
    await this.getVariant(productId, variantId);
    await this.validateVariantOptions(input.variantOptions);
    return this.db.$transaction(async (tx) => {
      await tx.productVariant.update({ where: { id: variantId }, data: updateVariantData(input) });
      if (input.specification !== undefined) {
        await this.replaceSpecification(tx, { variantId }, input.specification);
      }
      if (input.variantOptions !== undefined) {
        await tx.productVariantOption.deleteMany({ where: { variantId } });
        if (input.variantOptions.length) {
          await tx.productVariantOption.createMany({ data: input.variantOptions.map((option) => ({ ...option, variantId })) });
        }
      }
      if (input.media !== undefined) {
        await tx.productMedia.deleteMany({ where: { variantId } });
        if (input.media.length) {
          await tx.productMedia.createMany({ data: input.media.map((media) => ({ ...media, variantId })) });
        }
      }
      return tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
        include: {
          media: { orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }] },
          variantOptions: { orderBy: [{ sortOrder: 'asc' }] },
          specification: {
            include: { specs: { orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] } },
          },
        },
      });
    });
  }

  private async validateVariantOptions(options?: CreateProductVariant['variantOptions']) {
    if (!options?.length) return;
    const attributeIds = new Set<string>();
    for (const option of options) {
      if (attributeIds.has(option.attributeId)) {
        throw new NotFoundException('Only one option per attribute can be assigned to a variant');
      }
      attributeIds.add(option.attributeId);
      const exists = await this.db.attributeOption.findFirst({
        where: {
          id: option.attributeOptionId,
          attributeId: option.attributeId,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Attribute option not found');
    }
  }

  private async replaceSpecification(
    tx: Prisma.TransactionClient,
    owner: { productId?: string; variantId?: string },
    input: ProductSpecificationInput,
  ) {
    const existing = await tx.productSpecification.findFirst({ where: owner, select: { id: true } });
    if (input.specs.length === 0) {
      if (existing) await tx.productSpecification.delete({ where: { id: existing.id } });
      return;
    }

    const { specs, ...group } = input;
    if (existing) {
      await tx.productSpecification.update({
        where: { id: existing.id },
        data: {
          title: group.title ?? 'Specifications',
          image: group.image ?? null,
          sortOrder: group.sortOrder ?? 0,
          specs: {
            deleteMany: {},
            create: specs.map((spec) => ({ ...spec, type: spec.type ?? 'TEXT', sortOrder: spec.sortOrder ?? 0 })),
          },
        },
      });
      return;
    }

    await tx.productSpecification.create({
      data: {
        ...owner,
        ...createSpecificationData(input),
      },
    });
  }

  private async replaceCareItems(
    tx: Prisma.TransactionClient,
    productId: string,
    items: ProductCareItemInput[],
  ) {
    await tx.productCareItem.deleteMany({ where: { productId } });
    if (items.length) {
      await tx.productCareItem.createMany({
        data: items.map((item, index) => ({
          productId,
          title: item.title,
          description: item.description ?? null,
          displayOrder: item.displayOrder ?? index,
        })),
      });
    }
  }

  async removeVariant(productId: string, variantId: string) {
    await this.getVariant(productId, variantId);
    await this.db.productVariant.update({ where: { id: variantId }, data: { deletedAt: new Date() } });
    return { id: variantId, deleted: true };
  }
}
