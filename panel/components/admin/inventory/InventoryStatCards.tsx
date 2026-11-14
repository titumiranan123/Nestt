import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck } from "lucide-react";
import type { InventoryItem } from "@/lib/inventory-media-demo";

export function InventoryStatCards({ items }: { items: InventoryItem[] }) {
  const totalAvailable = items.reduce((sum, item) => sum + item.stock - item.reserved, 0);
  const stats = [
    { label: "Total Variants", value: items.length, icon: Boxes, accent: false },
    { label: "Total Stock", value: items.reduce((sum, item) => sum + item.stock, 0), icon: PackageCheck, accent: true },
    { label: "Low Stock", value: items.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK").length, icon: AlertTriangle, accent: false },
    { label: "Available Stock", value: totalAvailable, icon: CircleDollarSign, accent: true },
  ];

  return (
    <section
      className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Inventory summary"
    >
      {stats.map(({ label, value, icon: Icon, accent }) => (
        <article
          key={label}
          className={`rounded-2xl border bg-white p-4 shadow-sm xs:p-5 ${accent ? "border-t-[3px] border-t-accent" : "border-t-[3px] border-t-brand"}`}
        >
          <div className={`flex size-10 items-center justify-center rounded-xl ${accent ? "bg-orange-50 text-accent" : "bg-brand-soft text-brand"}`}>
            <Icon size={19} strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${accent ? "text-accent" : "text-brand-dark"}`}>{value.toLocaleString("en-BD")}</p>
          <p className="mt-1 text-[11px] text-gray-500">{label === "Low Stock" ? "Needs replenishment" : "Across all product variants"}</p>
        </article>
      ))}
    </section>
  );
}
