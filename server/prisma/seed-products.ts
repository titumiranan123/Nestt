import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const catalog = [
  {
    categorySlug: 'sofas-sectionals',
    skuPrefix: 'SOFA',
    basePrice: 78500,
    imagePaths: [
      '/assets/figma-home/product-aero-sofa.png',
      '/assets/figma-home/fresh-vanguard.png',
      '/assets/figma-home/product-oslo.png',
    ],
    features: ['Kiln-dried hardwood frame', 'Comfortable seat cushions', 'Made for everyday living'],
    names: [
      'Haven Three-seat Sofa', 'Alder Modular Sectional', 'Cove Two-seat Loveseat',
      'Morrow Deep-seat Sofa', 'Linden Track-arm Sofa', 'Soren Corner Sectional',
      'Veda Sofa Bed', 'Kori Apartment Sofa', 'Arlo Chaise Sectional', 'Noma Sleeper Sofa',
    ],
  },
  {
    categorySlug: 'chairs-ottomans',
    skuPrefix: 'CHAIR',
    basePrice: 24500,
    imagePaths: [
      '/assets/figma-home/product-oslo.png',
      '/assets/figma-home/fresh-aero.png',
      '/assets/figma-home/category-chairs.png',
    ],
    features: ['Solid hardwood frame', 'Supportive seat', 'Pairs with a range of interiors'],
    names: [
      'Oslo High-back Lounge Chair', 'Aero Bentwood Accent Chair', 'Mira Upholstered Armchair',
      'Cove Swivel Chair', 'Linden Reading Chair', 'Arlo Dining Chair',
      'Soren Occasional Chair', 'Noma Barrel Chair', 'Veda Upholstered Ottoman', 'Kori Storage Ottoman',
    ],
  },
  {
    categorySlug: 'tables',
    skuPrefix: 'TABLE',
    basePrice: 18500,
    imagePaths: [
      '/assets/figma-home/product-kyoto.png',
      '/assets/figma-home/product-arcus.png',
      '/assets/figma-home/category-tables.png',
    ],
    features: ['Solid wood construction', 'Durable easy-care finish', 'Designed for daily use'],
    names: [
      'Kyoto Extendable Dining Table', 'Mira Round Coffee Table', 'Alder Rectangular Dining Table',
      'Noma Nesting Side Tables', 'Cove Oval Coffee Table', 'Arlo Writing Desk',
      'Soren Bedside Table', 'Veda Console Table', 'Kori Solid Wood Desk', 'Linden Round Dining Table',
    ],
  },
  {
    categorySlug: 'beds-bedroom',
    skuPrefix: 'BED',
    basePrice: 68500,
    imagePaths: [
      '/assets/figma-home/product-sylvan.png',
      '/assets/products/bed-frame.jpg',
      '/assets/figma-home/category-beds.png',
    ],
    features: ['Sturdy hardwood frame', 'Quiet supportive platform', 'Made for restful nights'],
    names: [
      'Sylvan Hydraulic King Bed', 'Mira Upholstered Queen Bed', 'Alder Solid Wood Bed Frame',
      'Noma Low-profile King Bed', 'Cove Storage Queen Bed', 'Veda Slatted Platform Bed',
      'Arlo Upholstered Bed', 'Kori Compact Double Bed', 'Linden Panel Bed', 'Soren Floating Bed Frame',
    ],
  },
  {
    categorySlug: 'storage-cabinets',
    skuPrefix: 'STORE',
    basePrice: 29500,
    imagePaths: [
      '/assets/figma-home/product-arcus.png',
      '/assets/products/sideboard.jpg',
      '/assets/figma-home/category-storage.png',
    ],
    features: ['Smooth-close storage', 'Thoughtful cable and shelf space', 'Solid wood detailing'],
    names: [
      'Arcus Fluted Timber Credenza', 'Mira Six-drawer Dresser', 'Alder Media Console',
      'Cove Two-door Sideboard', 'Noma Entryway Cabinet', 'Veda Bedside Nightstand',
      'Arlo Open Shelf Bookcase', 'Kori Shoe Storage Cabinet', 'Linden Tallboy Dresser', 'Soren Modular Bookcase',
    ],
  },
  {
    categorySlug: 'lighting',
    skuPrefix: 'LIGHT',
    basePrice: 8500,
    imagePaths: [
      '/assets/categories/lighting.jpg',
      '/assets/figma-home/category-decor.png',
    ],
    features: ['Warm ambient light', 'Easy-to-place design', 'Made for everyday use'],
    names: [
      'Noma Arc Floor Lamp', 'Mira Ceramic Table Lamp', 'Alder Adjustable Desk Lamp',
      'Cove Dome Pendant Light', 'Veda Linen Shade Floor Lamp', 'Arlo Brass Wall Sconce',
      'Linden Tripod Table Lamp', 'Kori Opal Glass Pendant', 'Soren Reading Floor Lamp', 'Haven Sculptural Table Lamp',
    ],
  },
  {
    categorySlug: 'rugs-decor',
    skuPrefix: 'DECOR',
    basePrice: 6500,
    imagePaths: [
      '/assets/figma-home/category-decor.png',
      '/assets/categories/decor.jpg',
      '/assets/rooms/living-room.jpg',
    ],
    features: ['Considered texture and finish', 'Easy to style with existing pieces', 'Designed for everyday living'],
    names: [
      'Mira Handwoven Area Rug', 'Cove Textured Wool Rug', 'Alder Geometric Area Rug',
      'Noma Ceramic Decorative Vase', 'Veda Woven Cushion Set', 'Arlo Patterned Runner Rug',
      'Linden Round Jute Rug', 'Kori Stoneware Bowl Set', 'Soren Fringe Wool Rug', 'Haven Textured Throw Blanket',
    ],
  },
] as const;

const colorNames = ['Natural Oat', 'Tatum Slate'];

async function seedProducts() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Product seed data cannot be created in production');
  }

  const siteUrl = (process.env.APP_BASE_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  const categoryRows = await db.category.findMany({
    where: { slug: { in: catalog.map((entry) => entry.categorySlug) }, deletedAt: null },
    select: { id: true, slug: true },
  });
  const categoryIds = new Map(categoryRows.map((category) => [category.slug, category.id]));
  const missingCategories = catalog.map((entry) => entry.categorySlug).filter((slug) => !categoryIds.has(slug));
  if (missingCategories.length) {
    throw new Error(`Seed categories first. Missing: ${missingCategories.join(', ')}`);
  }

  const colorAttribute = await db.attribute.findFirst({
    where: { slug: 'color', deletedAt: null, isPublished: true },
    select: { id: true },
  });
  if (!colorAttribute) throw new Error('Seed product attributes first. Missing published Color attribute.');

  const colorOptions = await db.attributeOption.findMany({
    where: { attributeId: colorAttribute.id, name: { in: [...colorNames] }, deletedAt: null, isPublished: true },
    select: { id: true, name: true },
  });
  const colorOptionIds = new Map(colorOptions.map((option) => [option.name, option.id]));
  const missingColors = colorNames.filter((name) => !colorOptionIds.has(name));
  if (missingColors.length) {
    throw new Error(`Seed product attributes first. Missing Color values: ${missingColors.join(', ')}`);
  }

  let productCount = 0;
  let variantCount = 0;

  for (const category of catalog) {
    const categoryId = categoryIds.get(category.categorySlug)!;

    for (const [index, name] of category.names.entries()) {
      const productNumber = String(index + 1).padStart(2, '0');
      const productSlug = `${category.categorySlug}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      const imagePath = category.imagePaths[index % category.imagePaths.length]!;
      const product = await db.product.upsert({
        where: { slug: productSlug },
        update: {
          name,
          categoryId,
          description: `${name} brings considered design and everyday comfort to your home. Choose the finish and configuration that works for your space.`,
          tags: [category.categorySlug, 'sample', 'furniture'],
          status: 'active',
          sortOrder: index + 1,
          isFeatured: index < 2,
          isNewArrival: index >= 8,
          isBestSeller: index === 0,
          features: [...category.features],
          deletedAt: null,
        },
        create: {
          name,
          slug: productSlug,
          tags: [category.categorySlug, 'sample', 'furniture'],
          categoryId,
          description: `${name} brings considered design and everyday comfort to your home. Choose the finish and configuration that works for your space.`,
          useEnvironment: 'indoor',
          status: 'active',
          sortOrder: index + 1,
          isFeatured: index < 2,
          isNewArrival: index >= 8,
          isBestSeller: index === 0,
          features: [...category.features],
        },
        select: { id: true },
      });
      productCount += 1;

      for (const [variantIndex, colorName] of colorNames.entries()) {
        const variantCode = colorName === 'Natural Oat' ? 'OAT' : 'SLATE';
        const sku = `NESTT-SEED-${category.skuPrefix}-${productNumber}-${variantCode}`;
        const variantSlug = `${productSlug}-${variantCode.toLowerCase()}`;
        const price = category.basePrice + index * 2500 + variantIndex * 1500;
        const existingVariant = await db.productVariant.findUnique({ where: { sku }, select: { id: true, productId: true } });
        if (existingVariant && existingVariant.productId !== product.id) {
          throw new Error(`Seed SKU ${sku} already belongs to another product.`);
        }

        const variant = await db.productVariant.upsert({
          where: { sku },
          update: {
            productId: product.id,
            name: colorName,
            slug: variantSlug,
            description: `${name} in ${colorName}.`,
            status: 'active',
            sortOrder: variantIndex + 1,
            isDefault: variantIndex === 0,
            stockQty: 12 - variantIndex * 3,
            lowStockAlertQty: 5,
            stockStatus: 'IN_STOCK',
            price,
            costPrice: Math.round(price * 0.55),
            isOnSale: false,
            features: [],
            deletedAt: null,
          },
          create: {
            productId: product.id,
            sku,
            name: colorName,
            slug: variantSlug,
            description: `${name} in ${colorName}.`,
            status: 'active',
            sortOrder: variantIndex + 1,
            isDefault: variantIndex === 0,
            stockQty: 12 - variantIndex * 3,
            lowStockAlertQty: 5,
            stockStatus: 'IN_STOCK',
            price,
            costPrice: Math.round(price * 0.55),
            isOnSale: false,
          },
          select: { id: true },
        });
        variantCount += 1;

        await db.productVariantOption.upsert({
          where: { variantId_attributeId: { variantId: variant.id, attributeId: colorAttribute.id } },
          update: {
            attributeOptionId: colorOptionIds.get(colorName)!,
            displayValue: colorName,
            displayImage: null,
            sortOrder: 0,
          },
          create: {
            variantId: variant.id,
            attributeId: colorAttribute.id,
            attributeOptionId: colorOptionIds.get(colorName)!,
            displayValue: colorName,
            sortOrder: 0,
          },
        });

        const mediaUrl = `${siteUrl}${category.imagePaths[(index + variantIndex) % category.imagePaths.length]!}`;
        const existingMedia = await db.productMedia.findFirst({ where: { variantId: variant.id, url: mediaUrl, type: 'product' }, select: { id: true } });
        if (existingMedia) {
          await db.productMedia.update({
            where: { id: existingMedia.id },
            data: { alt: `${name} in ${colorName}`, isPrimary: true, displayOrder: 0 },
          });
        } else {
          await db.productMedia.create({
            data: { variantId: variant.id, url: mediaUrl, type: 'product', alt: `${name} in ${colorName}`, isPrimary: true, displayOrder: 0 },
          });
        }
      }
    }
  }

  console.info(`Seeded ${productCount} products and ${variantCount} variants across ${catalog.length} categories.`);
}

try {
  await seedProducts();
} finally {
  await db.$disconnect();
}
