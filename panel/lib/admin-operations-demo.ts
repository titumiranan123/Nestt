export type CustomerStatus = "ACTIVE" | "SUSPENDED" | "BANNED";
export type DemoCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  reviews: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  status: CustomerStatus;
  joinedAt: string;
  location: string;
};

export const demoCustomers: DemoCustomer[] = [
  { id: "CUS-1084", name: "Maliha Rahman", email: "maliha.rahman@example.com", phone: "+880 1712-345678", orders: 8, reviews: 3, isEmailVerified: true, isPhoneVerified: true, status: "ACTIVE", joinedAt: "2026-08-18", location: "Dhanmondi, Dhaka" },
  { id: "CUS-1083", name: "Fahim Ahmed", email: "fahim.ahmed@example.com", phone: "+880 1819-445522", orders: 5, reviews: 1, isEmailVerified: true, isPhoneVerified: false, status: "ACTIVE", joinedAt: "2026-07-24", location: "Bashundhara, Dhaka" },
  { id: "CUS-1082", name: "Nusrat Jahan", email: "nusrat.j@example.com", phone: "+880 1911-876543", orders: 12, reviews: 6, isEmailVerified: true, isPhoneVerified: true, status: "ACTIVE", joinedAt: "2026-06-02", location: "Gulshan, Dhaka" },
  { id: "CUS-1081", name: "Tanvir Hasan", email: "tanvir.hasan@example.com", phone: "+880 1610-765432", orders: 2, reviews: 0, isEmailVerified: false, isPhoneVerified: true, status: "SUSPENDED", joinedAt: "2026-05-15", location: "Uttara, Dhaka" },
  { id: "CUS-1080", name: "Sadia Islam", email: "sadia.islam@example.com", phone: "+880 1555-321098", orders: 4, reviews: 2, isEmailVerified: true, isPhoneVerified: true, status: "ACTIVE", joinedAt: "2026-04-19", location: "Mirpur, Dhaka" },
  { id: "CUS-1079", name: "Arif Chowdhury", email: "arif.c@example.com", phone: "+880 1700-887766", orders: 1, reviews: 0, isEmailVerified: false, isPhoneVerified: false, status: "BANNED", joinedAt: "2026-03-11", location: "Uttara, Dhaka" },
  { id: "CUS-1078", name: "Raisa Mahmud", email: "raisa.m@example.com", phone: "+880 1866-221100", orders: 7, reviews: 4, isEmailVerified: true, isPhoneVerified: true, status: "ACTIVE", joinedAt: "2026-02-05", location: "Kalabagan, Dhaka" },
];

export type DemoStaff = { id: string; name: string; email: string; phone: string; role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT"; status: "ACTIVE" | "SUSPENDED"; verified: boolean; lastActive: string; joinedAt: string };
export const demoStaff: DemoStaff[] = [
  { id: "ST-001", name: "Nadia Karim", email: "nadia@nestt.com", phone: "+880 1711-223344", role: "SUPER_ADMIN", status: "ACTIVE", verified: true, lastActive: "Just now", joinedAt: "2025-03-08" },
  { id: "ST-002", name: "Rafi Ahmed", email: "rafi@nestt.com", phone: "+880 1812-445566", role: "ADMIN", status: "ACTIVE", verified: true, lastActive: "12 min ago", joinedAt: "2025-06-12" },
  { id: "ST-003", name: "Sohana Islam", email: "sohana@nestt.com", phone: "+880 1913-667788", role: "MANAGER", status: "ACTIVE", verified: true, lastActive: "1 hour ago", joinedAt: "2025-08-02" },
  { id: "ST-004", name: "Imran Hossain", email: "imran@nestt.com", phone: "+880 1614-889900", role: "SUPPORT", status: "SUSPENDED", verified: false, lastActive: "3 days ago", joinedAt: "2025-10-19" },
];

export type DemoAuditLog = { id: string; actor: string; role: string; action: string; resource: string; status: "SUCCESS" | "FAILED"; ip: string; createdAt: string; details: string };
export const demoAuditLogs: DemoAuditLog[] = [
  { id: "LOG-2481", actor: "Nadia Karim", role: "SUPER_ADMIN", action: "Updated permissions", resource: "Role · Manager", status: "SUCCESS", ip: "103.92.44.18", createdAt: "2026-10-28T10:42:00", details: "Changed product and order access for the Manager role." },
  { id: "LOG-2480", actor: "Rafi Ahmed", role: "ADMIN", action: "Changed order status", resource: "Order · ORD-2026-1084", status: "SUCCESS", ip: "103.92.44.22", createdAt: "2026-10-28T09:18:00", details: "Moved order from Processing to Confirmed." },
  { id: "LOG-2479", actor: "Unknown user", role: "GUEST", action: "Sign-in attempt", resource: "Authentication", status: "FAILED", ip: "45.112.201.9", createdAt: "2026-10-27T22:31:00", details: "The sign-in attempt was rejected after invalid credentials." },
  { id: "LOG-2478", actor: "Sohana Islam", role: "MANAGER", action: "Updated product", resource: "Product · PR-1083", status: "SUCCESS", ip: "103.92.44.31", createdAt: "2026-10-27T16:25:00", details: "Updated product stock and storefront visibility." },
  { id: "LOG-2477", actor: "Nadia Karim", role: "SUPER_ADMIN", action: "Created staff", resource: "Staff · ST-004", status: "SUCCESS", ip: "103.92.44.18", createdAt: "2026-10-26T13:10:00", details: "Created a support account for the operations team." },
];

export type DemoBackup = { id: string; filename: string; status: "SUCCESS" | "RUNNING" | "FAILED"; size: string; startedAt: string; finishedAt: string; type: "Automatic" | "Manual" };
export const demoBackups: DemoBackup[] = [
  { id: "BK-1048", filename: "nestt-db-2026-10-28-1000.sql.gz", status: "SUCCESS", size: "18.4 MB", startedAt: "Oct 28, 2026 · 10:00 AM", finishedAt: "Oct 28, 2026 · 10:02 AM", type: "Automatic" },
  { id: "BK-1047", filename: "nestt-db-2026-10-28-0800.sql.gz", status: "SUCCESS", size: "18.2 MB", startedAt: "Oct 28, 2026 · 08:00 AM", finishedAt: "Oct 28, 2026 · 08:02 AM", type: "Automatic" },
  { id: "BK-1046", filename: "nestt-db-2026-10-28-0600.sql.gz", status: "FAILED", size: "—", startedAt: "Oct 28, 2026 · 06:00 AM", finishedAt: "Oct 28, 2026 · 06:01 AM", type: "Automatic" },
];

export const permissionResources = ["Dashboard", "Products", "Orders", "Customers", "Staff", "Inventory", "Website", "Marketing", "Reports", "Settings"];
export type PermissionAction = "read" | "create" | "update" | "delete" | "assign" | "export" | "download";
export const permissionActions: PermissionAction[] = ["read", "create", "update", "delete", "assign", "export", "download"];
export type DemoRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "SUPPORT";
export const roleLabels: Record<DemoRole, string> = { SUPER_ADMIN: "Super Admin", ADMIN: "Admin", MANAGER: "Manager", SUPPORT: "Support" };
export const demoRolePermissions: Record<DemoRole, string[]> = {
  SUPER_ADMIN: permissionResources.flatMap((resource) => permissionActions.map((action) => `${resource.toLowerCase()}:${action}`)),
  ADMIN: permissionResources.flatMap((resource) => permissionActions.filter((action) => action !== "assign" || ["Products", "Orders", "Customers", "Settings"].includes(resource)).map((action) => `${resource.toLowerCase()}:${action}`)),
  MANAGER: ["dashboard:read", "products:read", "products:create", "products:update", "orders:read", "orders:update", "customers:read", "customers:update", "inventory:read", "website:read", "marketing:read", "marketing:create", "reports:read", "reports:export", "settings:read"],
  SUPPORT: ["dashboard:read", "orders:read", "orders:update", "customers:read", "customers:update"],
};
