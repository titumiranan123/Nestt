import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const resources = [
  'Dashboard',
  'Products',
  'Orders',
  'Customers',
  'Staff',
  'Inventory',
  'Website',
  'Marketing',
  'Reports',
  'Settings',
] as const;

const actions = [
  'read',
  'create',
  'update',
  'delete',
  'assign',
  'export',
  'download',
] as const;

const roleGrants = {
  SUPER_ADMIN: resources.flatMap((resource) =>
    actions.map((action) => `${resource.toLowerCase()}:${action}`),
  ),
  ADMIN: resources.flatMap((resource) =>
    actions
      .filter(
        (action) =>
          action !== 'assign' ||
          ['Products', 'Orders', 'Customers', 'Settings'].includes(resource),
      )
      .map((action) => `${resource.toLowerCase()}:${action}`),
  ),
  MANAGER: [
    'dashboard:read',
    'products:read',
    'products:create',
    'products:update',
    'orders:read',
    'orders:update',
    'customers:read',
    'customers:update',
    'inventory:read',
    'website:read',
    'marketing:read',
    'marketing:create',
    'reports:read',
    'reports:export',
    'settings:read',
  ],
  SUPPORT: [
    'dashboard:read',
    'orders:read',
    'orders:update',
    'customers:read',
    'customers:update',
  ],
} as const;

const permissions = [
  ...resources.flatMap((resource) =>
    actions.map((action) => ({
      key: `${resource.toLowerCase()}:${action}`,
      action,
      resource: resource.toLowerCase(),
      description: `Can ${action} ${resource.toLowerCase()}`,
    })),
  ),
  {
    key: 'session:read',
    action: 'read',
    resource: 'session',
    description: 'Can read the authenticated session',
  },
];

async function seedPermissions() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Permission seed data cannot be created in production');
  }

  await db.$transaction(
    async (tx) => {
      const permissionIds = new Map<string, string>();
      for (const permission of permissions) {
        const record = await tx.permission.upsert({
          where: { key: permission.key },
          update: {
            action: permission.action,
            resource: permission.resource,
            description: permission.description,
          },
          create: permission,
          select: { id: true },
        });
        permissionIds.set(permission.key, record.id);
      }

      const sessionPermissionId = permissionIds.get('session:read');
      const allPermissions = [...permissionIds.values()];
      const grants: Record<keyof typeof roleGrants, string[]> = {
        SUPER_ADMIN: [...roleGrants.SUPER_ADMIN, 'session:read'],
        ADMIN: [...roleGrants.ADMIN, 'session:read'],
  MANAGER: [...roleGrants.MANAGER, 'session:read'],
  SUPPORT: [...roleGrants.SUPPORT, 'session:read'],
      };

      for (const [role, keys] of Object.entries(grants)) {
        const desiredPermissionIds = keys
          .map((key) => permissionIds.get(key))
          .filter((id): id is string => Boolean(id));

        await tx.rolePermission.deleteMany({
          where: {
            role: role as keyof typeof roleGrants,
            permissionId: { notIn: desiredPermissionIds },
          },
        });
        await tx.rolePermission.createMany({
          data: desiredPermissionIds.map((permissionId) => ({
            role: role as keyof typeof roleGrants,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      if (
        !sessionPermissionId ||
        allPermissions.length !== permissions.length
      ) {
        throw new Error('Permission catalog could not be fully seeded');
      }
    },
    { maxWait: 10_000, timeout: 60_000 },
  );

  console.info(
    `Seeded ${permissions.length} permissions and synchronized grants for ${Object.keys(roleGrants).length} roles.`,
  );
}

try {
  await seedPermissions();
} finally {
  await db.$disconnect();
}
