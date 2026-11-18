import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaClient, type DeliveryZone } from '@prisma/client';

type LocationName = { en: string; local: string };
type SourceUpazila = { name: LocationName };
type SourceDistrict = { name: LocationName; upazila: SourceUpazila[] };
type SourceDivision = { name: LocationName; district: SourceDistrict[] };
type SourceDataset = { data: SourceDivision[] };
type DhakaThanaDataset = { data: string[] };

const prisma = new PrismaClient();
const sourcePath = fileURLToPath(
  new URL('./data/bangladesh-admin-hierarchy.json', import.meta.url),
);
const dhakaThanasPath = fileURLToPath(
  new URL('./data/dhaka-metropolitan-thanas.json', import.meta.url),
);

async function seedBangladeshLocations() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Bangladesh location seed cannot run in production.');
  }

  const source = JSON.parse(
    readFileSync(sourcePath, 'utf8'),
  ) as SourceDataset;
  const dhakaThanaSource = JSON.parse(
    readFileSync(dhakaThanasPath, 'utf8'),
  ) as DhakaThanaDataset;
  const divisions = source.data;
  if (!Array.isArray(divisions) || divisions.length !== 8) {
    throw new Error('Expected the Bangladesh source dataset to contain 8 divisions.');
  }

  let districtCount = 0;
  let thanaCount = 0;
  let dhakaDivisionId: string | undefined;
  let dhakaDistrictId: string | undefined;

  await prisma.$transaction(async (tx) => {
    for (const divisionData of divisions) {
      const division = await tx.division.upsert({
        where: { name: divisionData.name.en },
        create: { name: divisionData.name.en },
        update: {},
      });
      if (divisionData.name.en === 'Dhaka') dhakaDivisionId = division.id;

      for (const districtData of divisionData.district) {
        districtCount += 1;
        const district = await tx.district.upsert({
          where: {
            divisionId_name: {
              divisionId: division.id,
              name: districtData.name.en,
            },
          },
          create: { name: districtData.name.en, divisionId: division.id },
          update: {},
        });
        if (divisionData.name.en === 'Dhaka' && districtData.name.en === 'Dhaka') {
          dhakaDistrictId = district.id;
        }

        for (const upazila of districtData.upazila) {
          thanaCount += 1;
          await tx.thana.upsert({
            where: {
              districtId_name: {
                districtId: district.id,
                name: upazila.name.en,
              },
            },
            create: {
              name: upazila.name.en,
              districtId: district.id,
              deliveryZone: 'OUTSIDE_DHAKA' satisfies DeliveryZone,
              isDeliverable: true,
            },
            // The standard upazila delivery zone is outside Dhaka; preserve
            // any per-Thana fee and availability settings on reruns.
            update: { deliveryZone: 'OUTSIDE_DHAKA' },
          });
        }
      }
    }

    if (!dhakaDivisionId || !dhakaDistrictId) {
      throw new Error('Dhaka Division/District not found in the location source.');
    }
    if (dhakaThanaSource.data.length !== 49) {
      throw new Error('Expected 49 Dhaka Metropolitan Police stations.');
    }
    for (const name of dhakaThanaSource.data) {
      thanaCount += 1;
      await tx.thana.upsert({
        where: { districtId_name: { districtId: dhakaDistrictId, name } },
        create: {
          name,
          districtId: dhakaDistrictId,
          deliveryZone: 'INSIDE_DHAKA',
          isDeliverable: true,
        },
        update: { deliveryZone: 'INSIDE_DHAKA' },
      });
    }

    await tx.deliveryZoneConfig.upsert({
      where: { zone: 'INSIDE_DHAKA' },
      create: {
        zone: 'INSIDE_DHAKA',
        flatFee: 60,
        isFree: false,
        minOrderFree: null,
        isActive: true,
      },
      update: {
        flatFee: 60,
        isFree: false,
        minOrderFree: null,
        isActive: true,
      },
    });
    await tx.deliveryZoneConfig.upsert({
      where: { zone: 'OUTSIDE_DHAKA' },
      create: {
        zone: 'OUTSIDE_DHAKA',
        flatFee: 120,
        isFree: false,
        minOrderFree: null,
        isActive: true,
      },
      update: {
        flatFee: 120,
        isFree: false,
        minOrderFree: null,
        isActive: true,
      },
    });
  }, { maxWait: 10_000, timeout: 120_000 });

  console.info(
    `Seeded ${divisions.length} divisions, ${districtCount} districts, and ${thanaCount} delivery areas (495 upazilas + 49 Dhaka metropolitan thanas). Delivery zones: Inside Dhaka ৳60, Outside Dhaka ৳120.`,
  );
}

try {
  await seedBangladeshLocations();
} finally {
  await prisma.$disconnect();
}
