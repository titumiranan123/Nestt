import 'dotenv/config';
import { access } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { demoProducts, type DemoProduct } from './product-detail-demo-catalog.ts';

const db = new PrismaClient();
const assetRoot = '/assets/demo-catalog';
const assetFiles = ['assembly.pdf', 'dimensions.webp', 'standard.glb', 'standard.usdz', 'standard-hero.webp',
  'standard-angle.webp', 'alternate.glb', 'alternate.usdz', 'alternate-hero.webp', 'alternate-angle.webp'];
const seedTag = 'pdp-demo';
const categories: Record<DemoProduct['category'], string> = {
  'sofas-sectionals': 'Sofas & Sectionals',
  'chairs-ottomans': 'Chairs & Ottomans',
  tables: 'Tables',
  'storage-cabinets': 'Storage & Cabinets',
  'beds-bedroom': 'Beds & Bedroom',
};

function specification(title: string, image: string | null, rows: Array<[string, string]>) {
  const specs = rows.map(([label, value], sortOrder) => ({ label, value, sortOrder }));
  return {
    create: { title, image, specs: { create: specs } },
    update: { title, image, specs: { deleteMany: {}, create: specs } },
  };
}

async function seedProductDetails() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Product detail demo data cannot be seeded in production.');
  }

  const site = new URL(process.env.APP_BASE_URL?.trim() || 'http://localhost:3000');
  if (site.protocol !== 'http:' && site.protocol !== 'https:') throw new Error('APP_BASE_URL must be a storefront HTTP(S) URL.');
  const assetUrl = (path: string) => new URL(`${assetRoot}/${path}`, site).href;
  const files = ['guarantee.pdf', ...demoProducts.flatMap(({ slug }) => assetFiles.map((file) => `${slug}/${file}`))];
  await Promise.all(files.map(async (file) => {
    try {
      await access(new URL(`../../web/public${assetRoot}/${file}`, import.meta.url));
    } catch (cause) {
      throw new Error(`Missing demo catalog asset ${file}.`, { cause });
    }
  }));

  await db.$transaction(async (tx) => {
    const categoryIds = new Map<string, string>();
    for (const [slug, name] of Object.entries(categories)) {
      const category = await tx.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
      if (!category.isPublished || category.deletedAt) throw new Error(`Publish category ${slug} before seeding the detail catalog.`);
      categoryIds.set(slug, category.id);
    }

    const brand = await tx.brand.upsert({
      where: { slug: 'nestt-studio-demo' },
      update: {},
      create: { slug: 'nestt-studio-demo', name: 'Nestt Studio', description: 'Nestt furniture demo collection' },
    });
    const color = await tx.attribute.upsert({
      where: { slug: 'color' },
      create: { slug: 'color', name: 'Color', showInFilter: true },
      update: {},
    });
    if (!color.isPublished || color.deletedAt) throw new Error('Publish the Color attribute before seeding the detail catalog.');

    const productIds = new Map<string, string>();
    for (const [index, item] of demoProducts.entries()) {
      const slug = `demo-${item.slug}`;
      const existing = await tx.product.findUnique({ where: { slug }, select: { tags: true } });
      if (existing && !existing.tags.includes(seedTag)) throw new Error(`Product slug ${slug} is already in use.`);

      const data = {
        categoryId: categoryIds.get(item.category)!,
        brandId: brand.id,
        name: item.name,
        description: item.description,
        tags: [seedTag, item.category, item.room.toLowerCase()],
        useEnvironment: 'indoor' as const,
        status: 'active' as const,
        sortOrder: index + 1,
        isFeatured: index === 0 || index === 1 || index === 6,
        isNewArrival: index >= 7,
        isBestSeller: false,
        isContractGrade: false,
        isCustomizable: false,
        isPriceOnRequest: false,
        features: [...item.features],
        assemblyRequired: item.assembly.required,
        assemblyDuration: item.assembly.minutes,
        assemblyPdfUrl: assetUrl(`${item.slug}/assembly.pdf`),
        guaranteeDays: 365,
        guaranteeLabel: '365-day demo guarantee',
        guaranteeUrl: assetUrl('guarantee.pdf'),
        deletedAt: null,
      };
      const care = item.care.map(([title, description], displayOrder) => ({ title, description, displayOrder }));
      const [width, depth, height] = item.dimensions;
      const specs = specification('Dimensions & materials', assetUrl(`${item.slug}/dimensions.webp`), [
        ['Width', `${width} mm`], ['Depth', `${depth} mm`], ['Height', `${height} mm`],
        ['Materials', item.materials], ['Room', item.room], ['Use environment', 'Indoor'], ...item.specs,
      ]);
      const product = await tx.product.upsert({
        where: { slug },
        create: { slug, ...data, careItems: { create: care }, specification: { create: specs.create } },
        update: { ...data, careItems: { deleteMany: {}, create: care }, specification: { upsert: specs } },
        select: { id: true },
      });
      productIds.set(item.slug, product.id);

      for (const [variantIndex, finish] of item.finishes.entries()) {
        const key = variantIndex === 0 ? 'standard' : 'alternate';
        const variantSlug = `${slug}-${key}`;
        const sku = `NESTT-PDP-${item.slug.toUpperCase()}-${key === 'standard' ? 'STD' : 'ALT'}`;
        const existingVariant = await tx.productVariant.findUnique({ where: { sku }, select: { productId: true } });
        if (existingVariant && existingVariant.productId !== product.id) throw new Error(`Variant SKU ${sku} is already in use.`);

        const swatch = await tx.attributeOption.upsert({
          where: { attributeId_name: { attributeId: color.id, name: finish.name } },
          update: {},
          create: { attributeId: color.id, name: finish.name, value: finish.swatch },
        });
        if (!swatch.isPublished || swatch.deletedAt) throw new Error(`Publish the ${finish.name} color option before seeding.`);
        const option = { attributeId: color.id, attributeOptionId: swatch.id, displayValue: finish.name, sortOrder: 0 };
        const photos = ['hero', 'angle'].map((view, displayOrder) => ({
          url: assetUrl(`${item.slug}/${key}-${view}.webp`),
          alt: `${item.name} in ${finish.name}, ${view === 'hero' ? 'main view' : 'alternate angle'}`,
          type: 'product' as const,
          isPrimary: displayOrder === 0,
          displayOrder,
        }));
        const asset = {
          modelUrl: assetUrl(`${item.slug}/${key}.glb`),
          usdzUrl: assetUrl(`${item.slug}/${key}.usdz`),
          dimensionsMm: item.dimensions,
          placement: 'floor',
          isPublished: true,
        };
        const price = item.price + variantIndex * 1200;
        const variantData = {
          slug: variantSlug,
          name: finish.name,
          barcode: sku,
          description: `${item.description}\n\nShown in ${finish.name}.`,
          features: [`${finish.name} finish`],
          status: 'active' as const,
          sortOrder: variantIndex,
          isDefault: variantIndex === 0,
          stockQty: variantIndex === 0 ? 16 : 6,
          lowStockAlertQty: 5,
          stockStatus: 'IN_STOCK' as const,
          price,
          isOnSale: false,
          costPrice: Math.round(price * 0.55),
          requiresWhiteGlove: item.whiteGlove ?? false,
          metaTitle: `${item.name} in ${finish.name} | Nestt`,
          metaDescription: `Explore the dimensions, care guide and 3D model for ${item.name} in ${finish.name}.`,
          deletedAt: null,
        };
        const variantSpecs = specification('Finish details', null, [['Finish', finish.name], ['Stock code', sku]]);
        const variant = await tx.productVariant.upsert({
          where: { sku },
          create: {
            sku, productId: product.id, ...variantData, specification: { create: variantSpecs.create },
            media: { create: photos }, arAsset: { create: asset },
          },
          update: {
            ...variantData, specification: { upsert: variantSpecs },
            media: { deleteMany: {}, create: photos }, arAsset: { upsert: { create: asset, update: asset } },
          },
          select: { id: true },
        });
        await tx.productVariantOption.upsert({
          where: { variantId_attributeId: { variantId: variant.id, attributeId: color.id } },
          create: { variantId: variant.id, ...option },
          update: option,
        });
      }
    }

    for (const item of demoProducts) {
      const sourceProductId = productIds.get(item.slug)!;
      for (const [displayOrder, pairSlug] of item.pairs.entries()) {
        const pairedProductId = productIds.get(pairSlug)!;
        const pair = { heading: 'Pairs well with', displayOrder, isActive: true };
        await tx.pairWellWith.upsert({
          where: { sourceProductId_pairedProductId: { sourceProductId, pairedProductId } },
          create: { sourceProductId, pairedProductId, ...pair },
          update: pair,
        });
      }
    }
  }, { timeout: 60_000 });

  console.info(`Seeded ${demoProducts.length} demo products and ${demoProducts.reduce((total, product) => total + product.finishes.length, 0)} variants.`);
}

try {
  await seedProductDetails();
} finally {
  await db.$disconnect();
}
