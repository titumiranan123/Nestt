export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";

export type InventoryItem = {
  id: string;
  sku: string;
  product: string;
  variant: string;
  category: string;
  brand: string;
  stock: number;
  reserved: number;
  threshold: number;
  status: InventoryStatus;
  price: number;
  swatch: string;
};

export type AdjustmentType = "PURCHASE" | "SALE" | "RETURN" | "CORRECTION" | "DAMAGE" | "TRANSFER";

export type AdjustmentItem = {
  id: string;
  variantId: string;
  sku: string;
  product: string;
  variant: string;
  type: AdjustmentType;
  quantity: number;
  reason: string;
  user: string;
  createdAt: string;
};

export const demoInventory: InventoryItem[] = [
  { id: "v-1", sku: "NT-CH-097", product: "Marlow dining chair", variant: "Natural oak · Set of 2", category: "Dining", brand: "Nestt Living", stock: 24, reserved: 3, threshold: 8, status: "IN_STOCK", price: 12500, swatch: "bg-amber-200" },
  { id: "v-2", sku: "NT-TB-026", product: "Oakline side table", variant: "Natural oak · 45 cm", category: "Living", brand: "Oakline", stock: 2, reserved: 1, threshold: 6, status: "LOW_STOCK", price: 8900, swatch: "bg-orange-200" },
  { id: "v-3", sku: "NT-ST-012", product: "Arlo accent stool", variant: "Sand · Small", category: "Living", brand: "Nestt Studio", stock: 0, reserved: 0, threshold: 5, status: "OUT_OF_STOCK", price: 6400, swatch: "bg-stone-300" },
  { id: "v-4", sku: "NT-BD-018", product: "Luma bedside pair", variant: "Warm white · 2 pcs", category: "Bedroom", brand: "Luma Home", stock: 13, reserved: 2, threshold: 5, status: "IN_STOCK", price: 18700, swatch: "bg-orange-100" },
  { id: "v-5", sku: "NT-SF-042", product: "Haven lounge sofa", variant: "Olive weave · 3 seater", category: "Living", brand: "Haven", stock: 4, reserved: 1, threshold: 7, status: "LOW_STOCK", price: 68500, swatch: "bg-green-200" },
  { id: "v-6", sku: "NT-DT-031", product: "Cove dining table", variant: "Smoked oak · 6 seat", category: "Dining", brand: "Nestt Living", stock: 9, reserved: 3, threshold: 4, status: "IN_STOCK", price: 42900, swatch: "bg-amber-300" },
  { id: "v-7", sku: "NT-LP-005", product: "Aster floor lamp", variant: "Matte black · 160 cm", category: "Lighting", brand: "Aster", stock: 7, reserved: 0, threshold: 5, status: "IN_STOCK", price: 14800, swatch: "bg-gray-500" },
  { id: "v-8", sku: "NT-RG-014", product: "Sora woven rug", variant: "Ivory · 160 × 230 cm", category: "Decor", brand: "Sora", stock: 3, reserved: 0, threshold: 6, status: "LOW_STOCK", price: 21900, swatch: "bg-stone-200" },
  { id: "v-9", sku: "NT-CH-111", product: "Noma counter stool", variant: "Walnut · Black seat", category: "Dining", brand: "Noma", stock: 0, reserved: 0, threshold: 4, status: "BACKORDER", price: 9900, swatch: "bg-amber-800" },
  { id: "v-10", sku: "NT-SH-022", product: "Milo wall shelf", variant: "Natural · 3 tier", category: "Storage", brand: "Nestt Studio", stock: 18, reserved: 2, threshold: 6, status: "IN_STOCK", price: 7200, swatch: "bg-yellow-200" },
  { id: "v-11", sku: "NT-BD-044", product: "Nila bed frame", variant: "Queen · Honey oak", category: "Bedroom", brand: "Nila Home", stock: 1, reserved: 1, threshold: 3, status: "LOW_STOCK", price: 52400, swatch: "bg-amber-300" },
  { id: "v-12", sku: "NT-LT-016", product: "Rin table lamp", variant: "Terracotta · 38 cm", category: "Lighting", brand: "Rin", stock: 11, reserved: 1, threshold: 4, status: "IN_STOCK", price: 5900, swatch: "bg-orange-300" },
];

export const demoAdjustments: AdjustmentItem[] = [
  { id: "ADJ-1094", variantId: "v-1", sku: "NT-CH-097", product: "Marlow dining chair", variant: "Natural oak · Set of 2", type: "PURCHASE", quantity: 12, reason: "Supplier restock · PO-2088", user: "Nadia Karim", createdAt: "2026-10-27T10:42:00" },
  { id: "ADJ-1093", variantId: "v-5", sku: "NT-SF-042", product: "Haven lounge sofa", variant: "Olive weave · 3 seater", type: "SALE", quantity: -2, reason: "Online order fulfillment", user: "Rafi Ahmed", createdAt: "2026-10-27T09:18:00" },
  { id: "ADJ-1092", variantId: "v-3", sku: "NT-ST-012", product: "Arlo accent stool", variant: "Sand · Small", type: "DAMAGE", quantity: -1, reason: "Packaging damage on arrival", user: "Sohana Islam", createdAt: "2026-10-26T16:25:00" },
  { id: "ADJ-1091", variantId: "v-2", sku: "NT-TB-026", product: "Oakline side table", variant: "Natural oak · 45 cm", type: "RETURN", quantity: 1, reason: "Customer return inspected", user: "Nadia Karim", createdAt: "2026-10-26T13:10:00" },
  { id: "ADJ-1090", variantId: "v-8", sku: "NT-RG-014", product: "Sora woven rug", variant: "Ivory · 160 × 230 cm", type: "CORRECTION", quantity: -1, reason: "Cycle count correction", user: "Rafi Ahmed", createdAt: "2026-10-25T11:40:00" },
  { id: "ADJ-1089", variantId: "v-4", sku: "NT-BD-018", product: "Luma bedside pair", variant: "Warm white · 2 pcs", type: "TRANSFER", quantity: -2, reason: "Moved to showroom", user: "Sohana Islam", createdAt: "2026-10-24T15:32:00" },
  { id: "ADJ-1088", variantId: "v-6", sku: "NT-DT-031", product: "Cove dining table", variant: "Smoked oak · 6 seat", type: "PURCHASE", quantity: 5, reason: "Supplier restock · PO-2081", user: "Nadia Karim", createdAt: "2026-10-24T09:07:00" },
];

export function inventoryStatus(stock: number, threshold: number): InventoryStatus {
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock <= threshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export function formatTaka(value: number): string {
  return `৳${new Intl.NumberFormat("en-BD").format(value)}`;
}

export function formatInventoryDate(value: string): string {
  return new Date(value).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
}
