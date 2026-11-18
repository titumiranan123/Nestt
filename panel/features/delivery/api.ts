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

export type DeliveryAreaInput = {
  division: string;
  district: string;
  thana: string;
  deliveryZone: DeliveryZone;
  shippingFee: string | null;
  isDeliverable: boolean;
  freeDeliveryAbove: string | null;
};

export type UpdateDeliveryAreaInput = Omit<DeliveryAreaInput, "division" | "district">;

const json = (method: string, body: unknown) => ({
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export const deliveryApi = {
  listAreas: () => apiClient<DeliveryDivision[]>("/admin/orders/delivery-areas"),
  listZones: () => apiClient<DeliveryZoneConfig[]>("/admin/orders/delivery-zones"),
  createArea: (input: DeliveryAreaInput) => apiClient<DeliveryThana>("/admin/orders/delivery-areas", json("PUT", input)),
  updateArea: (id: string, input: UpdateDeliveryAreaInput) => apiClient<DeliveryThana>(`/admin/orders/delivery-areas/${id}`, json("PATCH", input)),
  removeArea: (id: string) => apiClient<{ id: string; deleted: boolean }>(`/admin/orders/delivery-areas/${id}`, { method: "DELETE" }),
  saveZone: (input: DeliveryZoneConfig) => apiClient<DeliveryZoneConfig>("/admin/orders/delivery-zones", json("PUT", input)),
};
