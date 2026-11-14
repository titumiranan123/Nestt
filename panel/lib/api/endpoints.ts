export const endpoints = {
  auth: {
    me: "/auth/me",
  },
  access: {
    roles: "/admin/access/roles",
    rolePermissions: (role: "ADMIN" | "MANAGER" | "SUPPORT") => `/admin/access/roles/${role}/permissions`,
  },
  staff: {
    list: "/admin/staff",
    item: (id: string) => `/admin/staff/${id}`,
    password: (id: string) => `/admin/staff/${id}/password`,
  },
  seo: {
    meta: "/admin/seo/meta",
    metaPage: (pageName: string) => `/admin/seo/meta/${encodeURIComponent(pageName)}`,
    robots: "/admin/seo/robots",
    sitemap: "/admin/seo/sitemap",
  },
} as const;
