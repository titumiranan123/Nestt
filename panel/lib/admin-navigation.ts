import { isPermission, type Permission } from "@/lib/rbac/permissions";

export type AdminNavItem = {
  title?: string;
  icon?: string;
  href?: string;
  section?: string;
  featureKey?: string;
  requiredPermission?: string;
  children?: AdminNavItem[];
};

export const sidebarMenu: AdminNavItem[] = [
  { title: "Home", icon: "home", href: "/admin", featureKey: "dashboard", requiredPermission: "dashboard:read" },
  { section: "Main Features" },
  { title: "Orders", icon: "bag", featureKey: "order", children: [{ title: "All Orders", href: "/admin/orders", requiredPermission: "all-orders:read" }] },
  { title: "Offline Sale (POS)", icon: "store", featureKey: "order", children: [{ title: "Offline Sale", href: "/admin/offiline-sale", requiredPermission: "order:create" }] },
  { title: "Products", icon: "box", featureKey: "product", children: [
    { title: "All Products", href: "/admin/products", requiredPermission: "product:read" },
    { title: "Category List", href: "/admin/categories", requiredPermission: "category:read" },
    { title: "Attributes", href: "/admin/products/attributes", requiredPermission: "attribute:read" },
    { title: "Category Attributes", href: "/admin/category-attributes", requiredPermission: "category:update" },
    { title: "Brands", href: "/admin/brands", requiredPermission: "brand:read" },
    { title: "Reviews", href: "/admin/products/reviews", featureKey: "review", requiredPermission: "review:read" },
    { title: "Questions", href: "/admin/products/questions", featureKey: "review", requiredPermission: "review:read" },
  ] },
  { title: "Inventory", icon: "layers", featureKey: "stock", children: [
    { title: "Stock Management", href: "/admin/inventory", requiredPermission: "stock:read" },
    { title: "Stock Adjustment", href: "/admin/inventory/adjustments", requiredPermission: "stock:adjust" },
    { title: "Low Stock Alerts", href: "/admin/inventory/low-stock", requiredPermission: "stock:read" },
  ] },
  { title: "Media", icon: "upload", featureKey: "media-tools", children: [
    { title: "Bulk Image Upload", href: "/admin/bulk-image-upload", requiredPermission: "file:bulk-upload" },
    { title: "Video Upload", href: "/admin/video-upload", requiredPermission: "video:upload" },
  ] },
  { title: "Customers", icon: "users", featureKey: "user", children: [{ title: "Customer List", href: "/admin/customers", requiredPermission: "user:read" }] },
  { title: "Access Control", icon: "shield", featureKey: "role-permission", children: [{ title: "Role Permissions", href: "/admin/access/roles", requiredPermission: "role-permission:assign" }] },
  { title: "Administration", icon: "users", featureKey: "staff-user", children: [
    { title: "Staff Management", href: "/admin/staff", requiredPermission: "staff-user:read" },
    { title: "Audit Logs", icon: "history", href: "/admin/audit-logs", featureKey: "audit", requiredPermission: "audit:read" },
    { title: "Backup History", icon: "database", href: "/admin/backups", requiredPermission: "backup:read" },
  ] },
  { title: "Marketing", icon: "megaphone", featureKey: "coupon", children: [
    { title: "Coupons", href: "/admin/coupons", requiredPermission: "coupon:read" },
    { title: "Notifications", icon: "bell", href: "/admin/notifications", featureKey: "notification", requiredPermission: "notification:read" },
  ] },
  { title: "Reports", icon: "chart", featureKey: "report", children: [
    { title: "Sales Report", href: "/admin/reports/sales", requiredPermission: "report:read" },
    { title: "Product Report", href: "/admin/reports/products", requiredPermission: "report:read" },
    { title: "Inventory Report", href: "/admin/reports/inventory", requiredPermission: "report:read" },
    { title: "Customer Report", href: "/admin/reports/customers", requiredPermission: "report:read" },
    { title: "Revenue Analytics", href: "/admin/reports/revenue", requiredPermission: "report:read" },
  ] },
  { title: "SEO", icon: "search", featureKey: "seo", children: [
    { title: "SEO Overview", href: "/admin/seo", requiredPermission: "seo:read" },
    { title: "Page SEO", href: "/admin/seo/page-seo", requiredPermission: "seo:read" },
    { title: "Robot Config", href: "/admin/seo/robots", featureKey: "robot", requiredPermission: "robot:read" },
    { title: "Sitemap Config", href: "/admin/seo/sitemap", featureKey: "sitemap", requiredPermission: "sitemap:read" },
  ] },
  { title: "Settings", icon: "settings", featureKey: "policy-setting", children: [
    { title: "General Settings", href: "/admin/settings/general", requiredPermission: "policy-setting:read" },
    { title: "Delivery Zones", href: "/admin/settings/shipping", featureKey: "location", requiredPermission: "location:read" },
    { title: "Location Management", href: "/admin/location", featureKey: "location", requiredPermission: "location:read" },
    { title: "Payment Settings", href: "/admin/settings/payments", featureKey: "payment-config", requiredPermission: "payment-config:read" },
  ] },
  { title: "Logout", icon: "logout", href: "/" },
];

const permissionAliases: Record<string, string> = {
  "all-orders:read": "orders:read",
  "order:create": "orders:create",
  "product:read": "products:read",
  "category:read": "products:read",
  "attribute:read": "products:read",
  "category:update": "products:update",
  "brand:read": "products:read",
  "review:read": "products:read",
  "stock:read": "inventory:read",
  "stock:adjust": "inventory:update",
  "file:bulk-upload": "website:create",
  "video:upload": "website:create",
  "user:read": "customers:read",
  "role-permission:assign": "settings:assign",
  "staff-user:read": "settings:read",
  "audit:read": "settings:read",
  "backup:read": "settings:download",
  "coupon:read": "marketing:read",
  "notification:read": "marketing:update",
  "report:read": "reports:read",
  "seo:read": "website:read",
  "robot:read": "website:update",
  "sitemap:read": "website:update",
  "policy-setting:read": "settings:read",
  "location:read": "settings:read",
  "payment-config:read": "settings:read",
};

const featureAliases: Record<string, string> = {
  order: "orders",
  product: "products",
  stock: "inventory",
  "media-tools": "website",
  user: "customers",
  "role-permission": "settings",
  "staff-user": "settings",
  audit: "settings",
  backup: "settings",
  coupon: "marketing",
  notification: "marketing",
  report: "reports",
  seo: "website",
  robot: "website",
  sitemap: "website",
  "policy-setting": "settings",
  location: "settings",
  "payment-config": "settings",
};

const hasPermission = (permissions: string[], permission?: string) =>
  !permission || permissions.includes(permissionAliases[permission] ?? permission);

const hasFeature = (permissions: string[], featureKey?: string) => {
  const resource = featureKey ? featureAliases[featureKey] ?? featureKey : undefined;
  return !resource || permissions.some((permission) => permission.startsWith(`${resource}:`));
};

export function filterMenuByPermissions(items: AdminNavItem[], permissions: string[]): AdminNavItem[] {
  const filtered = items.map((item) => {
    if (item.section) return item;
    if (item.children) {
      const children = filterMenuByPermissions(item.children, permissions);
      return children.length && hasFeature(permissions, item.featureKey) ? { ...item, children } : null;
    }
    return hasFeature(permissions, item.featureKey) && hasPermission(permissions, item.requiredPermission) ? item : null;
  }).filter((item): item is AdminNavItem => Boolean(item));

  return filtered.filter((item, index) => {
    if (!item.section) return true;
    return filtered.slice(index + 1).some((next) => !next.section && next.title !== "Logout");
  });
}

export function permissionForAdminPath(pathname: string): Permission | null {
  if (pathname === "/admin/products/new") return "products:create";
  if (/^\/admin\/products\/[0-9a-f-]{36}$/i.test(pathname)) return "products:update";
  const matches: Array<{ href: string; permission: Permission }> = [];
  const visit = (items: AdminNavItem[]) => {
    for (const item of items) {
      if (item.href && item.requiredPermission &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
        const permission = permissionAliases[item.requiredPermission] ?? item.requiredPermission;
        if (isPermission(permission)) matches.push({ href: item.href, permission });
      }
      if (item.children) visit(item.children);
    }
  };
  visit(sidebarMenu);
  if (pathname === "/admin/session-check") return "session:read";
  matches.sort((left, right) => right.href.length - left.href.length);
  return matches[0]?.permission ?? null;
}
