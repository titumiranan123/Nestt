import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const db = new PrismaClient();

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed data cannot be created in production');
  }

  const email = process.env.SEED_DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!email && !password) {
    console.info('No demo account configured; skipping seed.');
    return;
  }
  if (!email || !password || password.length < 12) {
    throw new Error(
      'Set both SEED_DEMO_EMAIL and a SEED_DEMO_PASSWORD of at least 12 characters',
    );
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  await db.user.upsert({
    where: { email },
    update: { passwordHash, emailVerifiedAt: new Date() },
    create: {
      name: email.split('@', 1)[0] || 'Customer',
      email,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });
  console.info('Development demo account seeded.');
}

try {
  await seed();
} finally {
  await db.$disconnect();
}
