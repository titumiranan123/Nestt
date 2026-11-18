import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const categories = [
  {
    name: 'Sofas & Sectionals',
    slug: 'sofas-sectionals',
    description: 'Sofas, sectionals, loveseats, and sofa beds for living spaces.',
    image: '/assets/figma-home/category-sofas.png',
    sortOrder: 1,
    isPopularCat: true,
    metaKeywords: ['sofas', 'sectionals', 'loveseats', 'sofa beds'],
  },
  {
    name: 'Chairs & Ottomans',
    slug: 'chairs-ottomans',
    description: 'Lounge chairs, accent chairs, dining chairs, and ottomans.',
    image: '/assets/figma-home/category-chairs.png',
    sortOrder: 2,
    isPopularCat: true,
    metaKeywords: ['chairs', 'lounge chairs', 'accent chairs', 'ottomans'],
  },
  {
    name: 'Tables',
    slug: 'tables',
    description: 'Dining tables, coffee tables, desks, and side tables.',
    image: '/assets/figma-home/category-tables.png',
    sortOrder: 3,
    isPopularCat: true,
    metaKeywords: ['dining tables', 'coffee tables', 'desks', 'side tables'],
  },
  {
    name: 'Beds & Bedroom',
    slug: 'beds-bedroom',
    description: 'Beds, bed frames, and furniture for the bedroom.',
    image: '/assets/figma-home/category-beds.png',
    sortOrder: 4,
    isPopularCat: true,
    metaKeywords: ['beds', 'bed frames', 'bedroom furniture'],
  },
  {
    name: 'Storage & Cabinets',
    slug: 'storage-cabinets',
    description: 'Dressers, nightstands, sideboards, cabinets, and shelving.',
    image: '/assets/figma-home/category-storage.png',
    sortOrder: 5,
    isPopularCat: true,
    metaKeywords: ['storage', 'cabinets', 'dressers', 'nightstands', 'shelving'],
  },
  {
    name: 'Lighting',
    slug: 'lighting',
    description: 'Floor lamps, table lamps, pendants, and wall lighting.',
    image: '/assets/categories/lighting.jpg',
    sortOrder: 6,
    isPopularCat: false,
    metaKeywords: ['lighting', 'floor lamps', 'table lamps', 'pendants'],
  },
  {
    name: 'Rugs & Decor',
    slug: 'rugs-decor',
    description: 'Rugs and decorative accents to finish a room.',
    image: '/assets/figma-home/category-decor.png',
    sortOrder: 7,
    isPopularCat: false,
    metaKeywords: ['rugs', 'decor', 'home accessories'],
  },
];

async function seedProductCategories() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Product category seed data cannot be created in production');
  }

  const siteUrl = (process.env.APP_BASE_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
  const r2PublicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, '');

  for (const category of categories) {
    const { image, ...categoryData } = category;
    const imageExtension = image.split('.').at(-1);
    const imageUrl = r2PublicUrl && imageExtension
      ? `${r2PublicUrl}/categories/${category.slug}.${imageExtension}`
      : `${siteUrl}${image}`;
    await db.category.upsert({
      where: { slug: category.slug },
      update: {
        ...categoryData,
        logo: imageUrl,
        isPublished: true,
      },
      create: {
        ...categoryData,
        logo: imageUrl,
        isPublished: true,
      },
    });
  }

  console.info(`Seeded ${categories.length} product categories with image URLs.`);
}

try {
  await seedProductCategories();
} finally {
  await db.$disconnect();
}
