import { adjustmentLabels, type AdjustmentItem, type AdjustmentType, type InventoryItem } from "./types";

export const MAX_INVENTORY_QUANTITY = 1_000_000;

export function matchesInventorySearch(query: string, ...fields: (string | null)[]) {
  const term = query.trim().toLowerCase();
  return !term || fields.some((field) => field?.toLowerCase().includes(term));
}

export function needsReplenishment({ status }: InventoryItem) {
  return status === "LOW_STOCK" || status === "OUT_OF_STOCK";
}

export function adjustmentDirection(type: AdjustmentType) {
  if (type === "CORRECTION") return 0;
  return type === "SALE" || type === "DAMAGE" || type === "TRANSFER" ? -1 : 1;
}

const inventoryDate = new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" });

export function formatInventoryDate(value: string) {
  return inventoryDate.format(new Date(value));
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((cell) => {
    const value = typeof cell === "string" && /^\s*[=+@-]|^[\t\r\n]/.test(cell) ? `'${cell}` : String(cell);
    return `"${value.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportAdjustmentHistory(items: AdjustmentItem[]) {
  downloadCsv("nestt-stock-adjustments.csv", [
    ["Date", "SKU", "Product", "Type", "Quantity", "Reason", "User"],
    ...items.map(({ createdAt, sku, product, type, quantity, reason, user }) =>
      [createdAt, sku, product, adjustmentLabels[type], quantity, reason ?? "", user]),
  ]);
}

export function exportInventory(items: InventoryItem[]) {
  downloadCsv("nestt-inventory.csv", [
    ["SKU", "Product", "Variant", "Category", "Brand", "Stock", "Reserved", "Available", "Alert qty", "Status"],
    ...items.map(({ sku, product, variant, category, brand, stock, reserved, available, threshold, status }) =>
      [sku, product, variant, category, brand ?? "", stock, reserved, available, threshold, status]),
  ]);
}
