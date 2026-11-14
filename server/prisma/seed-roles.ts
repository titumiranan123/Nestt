import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const db = new PrismaClient();

const accounts = [
  { role: 'SUPER_ADMIN', email: 'super-admin@nestt.local', name: 'Super Admin' },
  { role: 'ADMIN', email: 'admin@nestt.local', name: 'Admin' },
  { role: 'MANAGER', email: 'manager@nestt.local', name: 'Manager' },
  { role: 'SUPPORT', email: 'support@nestt.local', name: 'Support' },
] as const;

async function seedRoles() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Role seed data cannot be created in production');
  }

  const password = process.env.SEED_ROLE_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('Set SEED_ROLE_PASSWORD to at least 12 characters');
  }

  const now = new Date();
  for (const account of accounts) {
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    await db.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        role: account.role,
        passwordHash,
        emailVerifiedAt: now,
        isEmailVerified: true,
      },
      create: {
        ...account,
        passwordHash,
        emailVerifiedAt: now,
        isEmailVerified: true,
      },
    });
  }

  console.info(`Seeded ${accounts.length} role accounts.`);
}

try {
  await seedRoles();
} finally {
  await db.$disconnect();
}
