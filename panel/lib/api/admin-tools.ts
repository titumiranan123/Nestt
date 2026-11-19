import { apiClient, apiDownload } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { CatalogRecord } from "@/lib/catalog-demo-data";
import type { DemoAuditLog } from "@/lib/admin-operations-demo";
import type { DemoNotification } from "@/lib/admin-tools-demo";
import type { DemoBackup } from "@/lib/admin-operations-demo";

export type BrandInput = { name: string; slug: string; description: string | null; logo: string | null; verified: boolean; isPublished: boolean; metaTitle: string | null; metaDescription: string | null; metaKeywords: string };
type BrandResponse = Omit<CatalogRecord, "metaKeywords"> & { _count?: { products: number }; productCount?: number; metaKeywords?: string[] };
const mapBrand = (brand: BrandResponse): CatalogRecord => ({ ...brand, productCount: brand.productCount ?? brand._count?.products ?? 0, metaKeywords: Array.isArray(brand.metaKeywords) ? brand.metaKeywords.join(", ") : brand.metaKeywords ?? "" });
export const brandApi = {
  list: async (signal?: AbortSignal) => (await apiClient<BrandResponse[]>(endpoints.brands.list, { signal })).map(mapBrand),
  create: async (input: BrandInput) => mapBrand(await apiClient<BrandResponse>(endpoints.brands.list, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, metaKeywords: String(input.metaKeywords ?? "").split(",").map((word) => word.trim()).filter(Boolean) }) })),
  update: async (id: string, input: BrandInput) => mapBrand(await apiClient<BrandResponse>(endpoints.brands.item(id), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, metaKeywords: String(input.metaKeywords ?? "").split(",").map((word) => word.trim()).filter(Boolean) }) })),
  remove: (id: string) => apiClient<{ id: string; deleted: boolean }>(endpoints.brands.item(id), { method: "DELETE" }),
};

export const notificationApi = {
  list: (signal?: AbortSignal) => apiClient<DemoNotification[]>(endpoints.adminTools.notifications, { signal }),
  read: (id: string) => apiClient(endpoints.adminTools.notificationRead(id), { method: "PATCH" }),
  readAll: () => apiClient(endpoints.adminTools.notificationsReadAll, { method: "PATCH" }),
};
export const auditLogApi = { list: (signal?: AbortSignal) => apiClient<DemoAuditLog[]>(endpoints.adminTools.auditLogs, { signal }) };
export type BackupRecord = DemoBackup & { error?: string; sizeBytes?: number | null };
export const backupApi = {
  list: (signal?: AbortSignal) => apiClient<BackupRecord[]>(endpoints.adminTools.backups, { signal }),
  create: () => apiClient<BackupRecord>(endpoints.adminTools.backups, { method: "POST" }),
  download: (id: string) => apiDownload(endpoints.adminTools.backupDownload(id)),
};
