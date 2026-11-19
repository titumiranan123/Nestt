export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PREORDER";

export type InventoryVariant = {
  id: string;
  sku: string;
  product: string;
  variant: string;
};

export type InventoryItem = InventoryVariant & {
  category: string;
  brand: string | null;
  stock: number;
  available: number;
  reserved: number;
  threshold: number;
  status: InventoryStatus;
};

export const adjustmentLabels = {
  RESTOCK: "Purchase",
  SALE: "Sale",
  RETURN: "Return",
  CORRECTION: "Correction",
  DAMAGE: "Damage",
  TRANSFER: "Transfer",
} as const;

export type AdjustmentType = keyof typeof adjustmentLabels;

export type AdjustmentInput = {
  id: string;
  variantId: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
};

export type AdjustmentItem = Omit<AdjustmentInput, "reason" | "variantId"> & {
  sku: string;
  product: string;
  variant: string;
  reason: string | null;
  user: string;
  createdAt: string;
};

export type AdjustmentLog = {
  variants: InventoryVariant[];
  movements: AdjustmentItem[];
};
