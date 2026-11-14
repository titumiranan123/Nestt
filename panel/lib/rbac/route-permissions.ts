import type { Permission } from "./permissions";

export type BffMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RoutePermission = {
  method: BffMethod;
  path: RegExp;
  permission: Permission | null;
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

  { method: "GET", path: /^admin\/access\/roles$/, permission: "settings:read" },
  { method: "PUT", path: /^admin\/access\/roles\/(ADMIN|MANAGER|SUPPORT)\/permissions$/, permission: "settings:update" },

  { method: "GET", path: /^admin\/staff$/, permission: "staff:read" },
  { method: "POST", path: /^admin\/staff$/, permission: "staff:create" },
  { method: "PATCH", path: new RegExp(`^admin/staff/${id}$`), permission: "staff:update" },
  { method: "PATCH", path: new RegExp(`^admin/staff/${id}/password$`), permission: "staff:update" },
  { method: "DELETE", path: new RegExp(`^admin/staff/${id}$`), permission: "staff:delete" },

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
  { method: "POST", path: /^admin\/categories$/, permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/categories/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/categories/${id}$`), permission: "products:delete" },
  { method: "GET", path: /^admin\/attributes$/, permission: "products:read" },
  { method: "POST", path: /^admin\/attributes$/, permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/attributes/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/attributes/${id}$`), permission: "products:delete" },
  { method: "POST", path: new RegExp(`^admin/attributes/${id}/options$`), permission: "products:create" },
  { method: "PUT", path: new RegExp(`^admin/attributes/${id}/options/${id}$`), permission: "products:update" },
  { method: "DELETE", path: new RegExp(`^admin/attributes/${id}/options/${id}$`), permission: "products:delete" },

  { method: "GET", path: /^admin\/orders$/, permission: "orders:read" },
  { method: "GET", path: /^admin\/orders\/delivery-areas$/, permission: "orders:read" },
  { method: "PUT", path: /^admin\/orders\/delivery-areas$/, permission: "orders:update" },
  { method: "GET", path: /^admin\/orders\/delivery-zones$/, permission: "orders:read" },
  { method: "PUT", path: /^admin\/orders\/delivery-zones$/, permission: "orders:update" },
  { method: "GET", path: new RegExp(`^admin/orders/${id}$`), permission: "orders:read" },
  { method: "PATCH", path: new RegExp(`^admin/orders/${id}/status$`), permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/orders/${id}/payment$`), permission: "orders:update" },
  { method: "POST", path: new RegExp(`^admin/orders/${id}/remarks$`), permission: "orders:update" },
  { method: "PATCH", path: new RegExp(`^admin/orders/returns/${id}$`), permission: "orders:update" },

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
