const resources = [
  "dashboard",
  "products",
  "orders",
  "customers",
  "staff",
  "inventory",
  "website",
  "marketing",
  "reports",
  "settings",
] as const;

const actions = [
  "read",
  "create",
  "update",
  "delete",
  "assign",
  "export",
  "download",
] as const;

export type Permission =
  | `${(typeof resources)[number]}:${(typeof actions)[number]}`
  | "session:read";

export const permissionRegistry: readonly Permission[] = [
  ...resources.flatMap((resource) =>
    actions.map((action) => `${resource}:${action}` as Permission),
  ),
  "session:read",
];

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" &&
    permissionRegistry.includes(value as Permission)
  );
}
