import { apiClient } from "@/lib/api/client";

export type DeliveryZone = "INSIDE_DHAKA" | "OUTSIDE_DHAKA";

export type DeliveryThana = {
  id: string;
  name: string;
  districtId: string;
  deliveryZone: DeliveryZone;
  shippingFee: string | null;
  isDeliverable: boolean;
  freeDeliveryAbove: string | null;
};

export type DeliveryDistrict = {
  id: string;
  name: string;
  divisionId: string;
  thanas: DeliveryThana[];
};

export type DeliveryDivision = {
  id: string;
  name: string;
  districts: DeliveryDistrict[];
};

export type DeliveryZoneConfig = {
  zone: DeliveryZone;
  flatFee: string;
  isFree: boolean;
  minOrderFree: string | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
};

export type DeliveryLocationInput =
  | { type: "division"; id?: string; data: { name: string } }
  | { type: "district"; id?: string; data: { name: string; divisionId: string } }
  | { type: "thana"; id?: string; data: Omit<DeliveryThana, "id"> };

type DeliveryLocationChange = { type: DeliveryLocationInput["type"]; id: string };

export type BulkDeliveryUpdate = {
  thanaIds: string[];
  deliveryZone?: DeliveryZone;
  isDeliverable?: boolean;
};

const deliveryPath = "/admin/delivery";
const locationPaths = { division: "divisions", district: "districts", thana: "thanas" };

const json = (method: string, body: unknown) => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const deliveryApi = {
  listAreas: (signal?: AbortSignal) => apiClient<DeliveryDivision[]>("/admin/orders/delivery-areas", { signal }),
  listManagedAreas: (signal?: AbortSignal) => apiClient<DeliveryDivision[]>(`${deliveryPath}/areas`, { signal }),
  listZones: (signal?: AbortSignal) => apiClient<DeliveryZoneConfig[]>(`${deliveryPath}/zone-configs`, { signal }),
  saveZone: (input: DeliveryZoneConfig) => apiClient<DeliveryZoneConfig>(`${deliveryPath}/zone-configs`, json("PUT", input)),
  saveLocation: ({ type, id, data }: DeliveryLocationInput) => apiClient<unknown>(
    `${deliveryPath}/${locationPaths[type]}${id ? `/${id}` : ""}`,
    json(id ? "PATCH" : "POST", data),
  ),
  removeLocation: ({ type, id }: DeliveryLocationChange) => apiClient<{ id: string; deleted: boolean }>(
    `${deliveryPath}/${locationPaths[type]}/${id}`, { method: "DELETE" },
  ),
  setDeliverability: (id: string, isDeliverable: boolean) => apiClient<DeliveryThana>(
    `${deliveryPath}/thanas/${id}`, json("PATCH", { isDeliverable }),
  ),
  bulkUpdate: (input: BulkDeliveryUpdate) => apiClient<{ updatedCount: number }>(
    `${deliveryPath}/thanas/bulk`, json("PATCH", input),
  ),
};
