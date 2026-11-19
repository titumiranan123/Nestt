import type {
  DeliveryDistrict,
  DeliveryDivision,
  DeliveryThana,
  DeliveryZone,
  DeliveryZoneConfig,
} from "./api";

export type { DeliveryZone };
export type ZoneConfig = DeliveryZoneConfig;
export type Division = Pick<DeliveryDivision, "id" | "name"> & { districtCount: number };
export type District = Pick<DeliveryDistrict, "id" | "name" | "divisionId"> & { thanaCount: number };
export type Thana = DeliveryThana & {
  district: { name: string; division: Pick<Division, "id" | "name"> };
};

export type EntityEditor =
  | { type: "division"; mode: "create" | "edit"; data?: Division }
  | { type: "district"; mode: "create" | "edit"; data?: District }
  | { type: "thana"; mode: "create" | "edit"; data?: Thana };

export type DeliveryConfirmation = {
  type: "confirm";
  title: string;
  description: string;
  label: string;
  action: { type: "delete"; entity: EntityEditor["type"]; id: string }
    | { type: "deliverability"; id: string; isDeliverable: boolean };
};

export type DeliveryDrawerContent = EntityEditor | { type: "zone"; data: ZoneConfig } | DeliveryConfirmation;

export type EntityFormState = {
  name: string;
  divisionId: string;
  districtId: string;
  deliveryZone: DeliveryZone;
  shippingFee: string;
  freeDeliveryAbove: string;
  isDeliverable: boolean;
};

export type ZoneFormState = {
  flatFee: string;
  minOrderFree: string;
  estimatedDaysMin: string;
  estimatedDaysMax: string;
  isFree: boolean;
  isActive: boolean;
};

export const zoneLabels: Record<DeliveryZone, string> = {
  INSIDE_DHAKA: "Inside Dhaka",
  OUTSIDE_DHAKA: "Outside Dhaka",
};
