import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const SITEMAP_ID = '00000000-0000-4000-8000-000000000001';

function getSiteOrigin(): string {
  const configuredUrl = process.env.APP_BASE_URL;
  if (!configuredUrl) {
    throw new Error(
      'APP_BASE_URL is required to seed canonical URLs, robots.txt, and sitemap.xml.',
    );
  }
  const url = new URL(configuredUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('APP_BASE_URL must use HTTP or HTTPS.');
  }
  return url.origin;
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function seedSeo() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'The SEO seed is disabled in production. Use the reviewed admin SEO API for live content.',
    );
  }

  const origin = getSiteOrigin();
  const today = new Date().toISOString().slice(0, 10);
  const pages = [
    {
      pageName: 'home',
      metaTitle: 'Thoughtful Furniture for Everyday Living | Nestt',
      metaDescription:
        'Explore thoughtfully designed sofas, beds, dining tables, chairs and storage at Nestt. Find comfortable furniture and room inspiration for your home in Bangladesh.',
      metaKeywords:
        'Nestt furniture, furniture Bangladesh, sofas, beds, dining tables, chairs, home storage, living room furniture',
      canonicalUrl: `${origin}/`,
      metaRobots: 'index, follow',
      twitterCardType: 'summary_large_image',
      schema: json({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Nestt',
        url: `${origin}/`,
        description: 'Thoughtful furniture for everyday living.',
        publisher: {
          '@type': 'Organization',
          name: 'Nestt',
          url: `${origin}/`,
        },
      }),
    },
    {
      pageName: 'product-details',
      metaTitle: 'Marlow 3-Seater Sofa in Bangladesh | Nestt',
      metaDescription:
        'Meet the Marlow 3-seater sofa: a softly sculptural silhouette, generous sink-in comfort and considered details for everyday living. Explore it at Nestt.',
      metaKeywords:
        'Marlow 3-seater sofa, three-seat sofa Bangladesh, comfortable living room sofa, Nestt sofa',
      canonicalUrl: `${origin}/product-details`,
      metaRobots: 'index, follow',
      twitterCardType: 'summary_large_image',
      schema: json({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Marlow 3-seater sofa',
        description:
          'A softly sculptural three-seat sofa with generous, sink-in comfort for everyday living.',
        image: [
          `${origin}/assets/hero/nestt-hero-living.png`,
          `${origin}/assets/hero/hero-detail.jpg`,
        ],
        brand: { '@type': 'Brand', name: 'Nestt' },
        category: 'Living room furniture > Sofas',
        offers: {
          '@type': 'Offer',
          url: `${origin}/product-details`,
          priceCurrency: 'BDT',
          price: '68900',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      }),
    },
  ];

  for (const page of pages) {
    await db.seoMeta.upsert({
      where: { pageName: page.pageName },
      create: page,
      update: page,
    });
  }

  const robots = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${origin}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `  <url><loc>${origin}/product-details</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    '</urlset>',
    '',
  ].join('\n');

  await db.siteRobots.upsert({
    where: { id: 1 },
    create: { id: 1, content: robots, updatedBy: 'seo-seed' },
    update: { content: robots, updatedBy: 'seo-seed' },
  });
  await db.siteSitemap.upsert({
    where: { id: SITEMAP_ID },
    create: { id: SITEMAP_ID, content: sitemap, updatedBy: 'seo-seed' },
    update: { content: sitemap, updatedBy: 'seo-seed' },
  });

  console.info(
    `Seeded SEO metadata for ${pages.length} live pages plus robots.txt and sitemap.xml.`,
  );
}

try {
  await seedSeo();
} finally {
  await db.$disconnect();
}
