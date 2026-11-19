export const endpoints = {
  auth: {
    me: "/auth/me",
  },
  dashboard: {
    overview: "/admin/dashboard",
    recentOrders: "/admin/dashboard/recent-orders",
    inventoryAlerts: "/admin/dashboard/inventory-alerts",
  },
  reports: {
    sales: "/admin/reports/sales",
    products: "/admin/reports/products",
    inventory: "/admin/reports/inventory",
    customers: "/admin/reports/customers",
    revenue: "/admin/reports/revenue",
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
  brands: {
    list: "/admin/brands",
    item: (id: string) => `/admin/brands/${id}`,
  },
  adminTools: {
    notifications: "/admin/notifications",
    notificationRead: (id: string) => `/admin/notifications/${id}/read`,
    notificationsReadAll: "/admin/notifications/read-all",
    auditLogs: "/admin/audit-logs",
    backups: "/admin/backups",
    backupDownload: (id: string) => `/admin/backups/${id}/download`,
  },
  inventory: {
    list: "/admin/inventory",
    adjustments: "/admin/inventory/adjustments",
    threshold: (id: string) => `/admin/inventory/variants/${id}/threshold`,
  },
  seo: {
    meta: "/admin/seo/meta",
    metaPage: (pageName: string) => `/admin/seo/meta/${encodeURIComponent(pageName)}`,
    robots: "/admin/seo/robots",
    sitemap: "/admin/seo/sitemap",
  },
} as const;
