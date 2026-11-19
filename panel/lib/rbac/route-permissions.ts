import type { Permission } from "./permissions";

export type BffMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RoutePermission = {
  method: BffMethod;
  path: RegExp;
  permission: Permission | null;
  bodyLimit?: number;
  timeoutMs?: number;
  range?: boolean;
};

const id = "[0-9a-f-]{36}";
const slug = "[a-z0-9-]{1,255}";

// Default deny: only explicitly listed backend routes can pass through the BFF.
export const routePermissions: readonly RoutePermission[] = [
  { method: "GET", path: /^auth\/me$/, permission: "session:read" },
  { method: "POST", path: /^auth\/email\/forgot-password$/, permission: null },
  { method: "POST", path: /^auth\/email\/reset-password$/, permission: null },

  { method: "GET", path: /^products$/, permission: null },
  { method: "GET", path: new RegExp(`^products/${slug}$`), permission: null },

  { method: "GET", path: /^admin\/dashboard$/, permission: "dashboard:read" },
  { method: "GET", path: /^admin\/dashboard\/recent-orders$/, permission: "orders:read" },
  { method: "GET", path: /^admin\/dashboard\/inventory-alerts$/, permission: "inventory:read" },

  { method: "GET", path: /^admin\/coupons$/, permission: "marketing:read" },
  { method: "POST", path: /^admin\/coupons$/, permission: "marketing:create" },
  { method: "PATCH", path: new RegExp(`^admin/coupons/${id}$`), permission: "marketing:update" },
  { method: "DELETE", path: new RegExp(`^admin/coupons/${id}$`), permission: "marketing:delete" },

  { method: "GET", path: /^admin\/reports\/(sales|products|inventory|customers|revenue)$/, permission: "reports:read", timeoutMs: 30_000 },

  { method: "GET", path: /^admin\/access\/roles$/, permission: "settings:read" },
  { method: "GET", path: /^admin\/access\/roles\/(SUPER_ADMIN|ADMIN|MANAGER|SUPPORT)\/audit$/, permission: "settings:read" },
  { method: "PUT", path: /^admin\/access\/roles\/(ADMIN|MANAGER|SUPPORT)\/permissions$/, permission: "settings:update" },

  { method: "POST", path: /^admin\/media\/images$/, permission: "website:create", bodyLimit: 10 * 1024 * 1024 + 64 * 1024, timeoutMs: 120_000 },
  { method: "POST", path: /^admin\/media\/videos$/, permission: "website:create" },
  { method: "PUT", path: new RegExp(`^admin/media/videos/${id}/chunks/\\d+$`), permission: "website:create", timeoutMs: 120_000 },
  { method: "POST", path: new RegExp(`^admin/media/videos/${id}/complete$`), permission: "website:create" },
  { method: "GET", path: new RegExp(`^media/${id}$`), permission: null, range: true, timeoutMs: 120_000 },

  { method: "GET", path: /^admin\/customers$/, permission: "customers:read" },
  { method: "GET", path: /^admin\/customers\/export$/, permission: "customers:export", timeoutMs: 120_000 },
  { method: "GET", path: new RegExp(`^admin/customers/${id}/avatar$`), permission: "customers:read" },
  { method: "POST", path: /^admin\/customers$/, permission: "customers:create" },
  { method: "PATCH", path: new RegExp(`^admin/customers/${id}$`), permission: "customers:update" },
  { method: "DELETE", path: new RegExp(`^admin/customers/${id}$`), permission: "customers:delete" },

  { method: "GET", path: /^admin\/staff$/, permission: "staff:read" },
  { method: "POST", path: /^admin\/staff$/, permission: "staff:create" },
  { method: "PATCH", path: new RegExp(`^admin/staff/${id}$`), permission: "staff:update" },
  { method: "PATCH", path: new RegExp(`^admin/staff/${id}/password$`), permission: "staff:update" },
  { method: "DELETE", path: new RegExp(`^admin/staff/${id}$`), permission: "staff:delete" },

  { method: "GET", path: /^admin\/inventory$/, permission: "inventory:read" },
  { method: "GET", path: /^admin\/inventory\/adjustments$/, permission: "inventory:update" },
  { method: "POST", path: /^admin\/inventory\/adjustments$/, permission: "inventory:update" },
  { method: "PATCH", path: new RegExp(`^admin/inventory/variants/${id}/threshold$`), permission: "inventory:update" },

  { method: "GET", path: /^admin\/products$/, permission: "products:read" },
  { method: "POST", path: /^admin\/products$/, permission: "products:create" },
  { method: "GET", path: new RegExp(`^admin/products/${id}$`), permission: "products:read" },
  { method: "PUT", path: new RegExp(`^admin/products/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/products/${id}$`), permission: "products:delete" },
  { method: "GET", path: new RegExp(`^admin/products/${id}/variants$`), permission: "products:read" },
  { method: "POST", path: new RegExp(`^admin/products/${id}/variants$`), permission: "products:create" },
  { method: "GET", path: new RegExp(`^admin/products/${id}/variants/${id}$`), permission: "products:read" },
  { method: "PUT", path: new RegExp(`^admin/products/${id}/variants/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/products/${id}/variants/${id}$`), permission: "products:delete" },
  { method: "GET", path: new RegExp(`^admin/ar-assets/variants/${id}$`), permission: "products:read" },
  { method: "PUT", path: new RegExp(`^admin/ar-assets/variants/${id}$`), permission: "products:update" },

  { method: "GET", path: /^admin\/categories$/, permission: "products:read" },
  { method: "GET", path: new RegExp(`^admin/categories/${id}$`), permission: "products:read" },
  { method: "POST", path: /^admin\/categories$/, permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/categories/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/categories/${id}$`), permission: "products:delete" },
  { method: "GET", path: /^admin\/attributes$/, permission: "products:read" },
  { method: "GET", path: new RegExp(`^admin/attributes/${id}$`), permission: "products:read" },
  { method: "POST", path: /^admin\/attributes$/, permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/attributes/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/attributes/${id}$`), permission: "products:delete" },
  { method: "POST", path: new RegExp(`^admin/attributes/${id}/options$`), permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/attributes/${id}/options/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/attributes/${id}/options/${id}$`), permission: "products:delete" },
  { method: "GET", path: /^admin\/brands$/, permission: "products:read" },
  { method: "POST", path: /^admin\/brands$/, permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/brands/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/brands/${id}$`), permission: "products:delete" },
  { method: "GET", path: /^admin\/notifications$/, permission: "marketing:read" },
  { method: "PATCH", path: /^admin\/notifications\/read-all$/, permission: "marketing:update" },
  { method: "PATCH", path: new RegExp(`^admin/notifications/${id}/read$`), permission: "marketing:update" },
  { method: "GET", path: /^admin\/audit-logs$/, permission: "settings:read" },
  { method: "GET", path: /^admin\/backups$/, permission: "settings:read" },
  { method: "POST", path: /^admin\/backups$/, permission: "settings:download", timeoutMs: 120_000 },
  { method: "GET", path: new RegExp(`^admin/backups/${id}/download$`), permission: "settings:download", timeoutMs: 120_000 },

  { method: "GET", path: /^admin\/delivery\/(areas|zone-configs)$/, permission: "settings:read" },
  { method: "PUT", path: /^admin\/delivery\/zone-configs$/, permission: "orders:update" },
  { method: "POST", path: /^admin\/delivery\/(divisions|districts|thanas)$/, permission: "orders:update" },
  { method: "PATCH", path: /^admin\/delivery\/thanas\/bulk$/, permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/delivery/(divisions|districts|thanas)/${id}$`), permission: "orders:update" },
  { method: "DELETE", path: new RegExp(`^admin/delivery/(divisions|districts|thanas)/${id}$`), permission: "orders:update" },

  { method: "GET", path: /^admin\/orders$/, permission: "orders:read" },
  { method: "POST", path: /^admin\/orders$/, permission: "orders:create" },
  { method: "GET", path: /^admin\/orders\/delivery-areas$/, permission: "orders:read" },
  { method: "PUT", path: /^admin\/orders\/delivery-areas$/, permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/orders/delivery-areas/${id}$`), permission: "orders:update" },
  { method: "DELETE", path: new RegExp(`^admin/orders/delivery-areas/${id}$`), permission: "orders:update" },
  { method: "GET", path: /^admin\/orders\/delivery-zones$/, permission: "orders:read" },
  { method: "PUT", path: /^admin\/orders\/delivery-zones$/, permission: "orders:update" },
  { method: "GET", path: new RegExp(`^admin/orders/${id}$`), permission: "orders:read" },
  { method: "PATCH", path: new RegExp(`^admin/orders/${id}/status$`), permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/orders/${id}/payment$`), permission: "orders:update" },
  { method: "POST", path: new RegExp(`^admin/orders/${id}/remarks$`), permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/orders/returns/${id}$`), permission: "orders:update" },

  { method: "GET", path: /^admin\/general-settings$/, permission: "settings:read" },
  { method: "PUT", path: /^admin\/general-settings$/, permission: "settings:update", bodyLimit: 3 * 1024 * 1024 },
  { method: "GET", path: /^admin\/payment-config$/, permission: "settings:read" },
  { method: "PUT", path: /^admin\/payment-config\/ssl$/, permission: "settings:update" },

  { method: "GET", path: /^admin\/blogs$/, permission: "website:read" },
  { method: "POST", path: /^admin\/blogs$/, permission: "website:create" },
  { method: "GET", path: new RegExp(`^admin/blogs/${slug}$`), permission: "website:read" },
  { method: "PUT", path: new RegExp(`^admin/blogs/${id}$`), permission: "website:update" },
  { method: "DELETE", path: new RegExp(`^admin/blogs/${id}$`), permission: "website:delete" },
  { method: "GET", path: /^admin\/blog-categories$/, permission: "website:read" },
  { method: "POST", path: /^admin\/blog-categories$/, permission: "website:create" },
  { method: "PUT", path: new RegExp(`^admin/blog-categories/${id}$`), permission: "website:update" },
  { method: "DELETE", path: new RegExp(`^admin/blog-categories/${id}$`), permission: "website:delete" },
  { method: "GET", path: /^admin\/blog-tags$/, permission: "website:read" },
  { method: "POST", path: /^admin\/blog-tags$/, permission: "website:create" },
  { method: "PUT", path: new RegExp(`^admin/blog-tags/${id}$`), permission: "website:update" },
  { method: "DELETE", path: new RegExp(`^admin/blog-tags/${id}$`), permission: "website:delete" },
  { method: "GET", path: /^admin\/footer-settings$/, permission: "website:read" },
  { method: "PUT", path: /^admin\/footer-settings$/, permission: "website:update" },
  { method: "GET", path: /^admin\/policy-settings$/, permission: "website:read" },
  { method: "PUT", path: /^admin\/policy-settings$/, permission: "website:update" },

  { method: "GET", path: /^admin\/seo\/meta$/, permission: "website:read" },
  { method: "POST", path: /^admin\/seo\/meta$/, permission: "website:update" },
  { method: "PUT", path: new RegExp(`^admin/seo/meta/${slug}$`), permission: "website:update" },
  { method: "DELETE", path: new RegExp(`^admin/seo/meta/${slug}$`), permission: "website:update" },
  { method: "GET", path: /^admin\/seo\/robots$/, permission: "website:read" },
  { method: "PUT", path: /^admin\/seo\/robots$/, permission: "website:update" },
  { method: "GET", path: /^admin\/seo\/sitemap$/, permission: "website:read" },
  { method: "PUT", path: /^admin\/seo\/sitemap$/, permission: "website:update" },
];

export function routeForRequest(method: string, path: string): RoutePermission | null {
  return routePermissions.find((entry) => entry.method === method && entry.path.test(path)) ?? null;
}

export function permissionForRoute(method: string, path: string): Permission | null {
  const route = routeForRequest(method, path);
  return route?.permission ?? null;
}
