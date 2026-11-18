import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const attributes = [
  {
    name: 'Color',
    slug: 'color',
    sortOrder: 1,
    showInFilter: true,
    options: [
      { name: 'Natural Oat', value: '#e9e2cf' },
      { name: 'Golden Wheat', value: '#d7b95b' },
      { name: 'Warm Stone', value: '#d7c7a5' },
      { name: 'Burnt Clay', value: '#c95738' },
      { name: 'Cedar Rust', value: '#9d4d32' },
      { name: 'Tatum Slate', value: '#655747' },
      { name: 'Forest Moss', value: '#314738' },
      { name: 'Deep Teal', value: '#283e48' },
      { name: 'Black', value: '#222222' },
      { name: 'White', value: '#f7f7f5' },
    ],
  },
  {
    name: 'Material',
    slug: 'material',
    sortOrder: 2,
    showInFilter: true,
    options: [
      { name: 'Solid Teak', value: 'Solid Teak' },
      { name: 'Solid Oak', value: 'Solid Oak' },
      { name: 'Walnut', value: 'Walnut' },
      { name: 'Smoked Oak', value: 'Smoked Oak' },
      { name: 'Boucle', value: 'Boucle' },
      { name: 'Performance Fabric', value: 'Performance Fabric' },
      { name: 'Leather', value: 'Leather' },
      { name: 'Metal', value: 'Metal' },
      { name: 'Rattan', value: 'Rattan' },
    ],
  },
  {
    name: 'Configuration',
    slug: 'configuration',
    sortOrder: 3,
    showInFilter: true,
    options: [
      { name: '1 Seater', value: '1 Seater' },
      { name: '2 Seater', value: '2 Seater' },
      { name: '3 Seater', value: '3 Seater' },
      { name: '4 Seater', value: '4 Seater' },
      { name: 'L-Shape', value: 'L-Shape' },
      { name: 'Corner', value: 'Corner' },
      { name: 'Ottoman', value: 'Ottoman' },
    ],
  },
  {
    name: 'Finish',
    slug: 'finish',
    sortOrder: 4,
    showInFilter: true,
    options: [
      { name: 'Natural', value: 'Natural' },
      { name: 'Light Oak', value: 'Light Oak' },
      { name: 'Walnut', value: 'Walnut' },
      { name: 'Smoked Oak', value: 'Smoked Oak' },
      { name: 'Black', value: 'Black' },
      { name: 'White', value: 'White' },
    ],
  },
  {
    name: 'Room',
    slug: 'room',
    sortOrder: 5,
    showInFilter: true,
    options: [
      { name: 'Living Room', value: 'Living Room' },
      { name: 'Bedroom', value: 'Bedroom' },
      { name: 'Dining Room', value: 'Dining Room' },
      { name: 'Entryway', value: 'Entryway' },
      { name: 'Home Office', value: 'Home Office' },
      { name: 'Outdoor', value: 'Outdoor' },
    ],
  },
] as const;

async function seedProductAttributes() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Product attribute seed data cannot be created in production');
  }

  let optionCount = 0;
  for (const attributeSeed of attributes) {
    const { options, ...attributeData } = attributeSeed;
    const attribute = await db.attribute.upsert({
      where: { slug: attributeSeed.slug },
      update: {
        ...attributeData,
        type: 'DROPDOWN',
        isPublished: true,
        deletedAt: null,
      },
      create: {
        ...attributeData,
        type: 'DROPDOWN',
        isPublished: true,
      },
    });

    for (const [index, option] of options.entries()) {
      await db.attributeOption.upsert({
        where: { attributeId_name: { attributeId: attribute.id, name: option.name } },
        update: {
          value: option.value,
          image: null,
          sortOrder: index + 1,
          isPublished: true,
          deletedAt: null,
        },
        create: {
          ...option,
          sortOrder: index + 1,
          isPublished: true,
          attributeId: attribute.id,
        },
      });
      optionCount += 1;
    }
  }

  console.info(`Seeded ${attributes.length} product attributes and ${optionCount} option values.`);
}

try {
  await seedProductAttributes();
} finally {
  await db.$disconnect();
}
