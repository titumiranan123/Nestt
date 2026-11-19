import Link from "next/link";
import { ArrowDownToLine, Boxes, Plus } from "lucide-react";

export function InventoryHeader({ title = "Inventory", eyebrow = "Stock control", description = "Track product variant stock, low stock thresholds, and reserved quantity.", secondaryHref = "/admin/inventory/low-stock", secondaryLabel = "Low Stock", primaryHref = "/admin/inventory/adjustments", primaryLabel = "Stock Adjustment", showPrimary = true }: {
  title?: string;
  eyebrow?: string;
  description?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  primaryHref?: string;
  primaryLabel?: string;
  showPrimary?: boolean;
}) {
  return (
    <header className="mb-4 flex flex-col gap-3 rounded-2xl border border-brand/10 bg-gradient-to-r from-brand-soft/75 via-white to-orange-50/65 px-4 py-4 shadow-sm xs:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
          <Boxes size={21} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-brand">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={secondaryHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand/15 bg-white px-4 py-2 text-sm font-semibold text-brand transition hover:border-brand/35 hover:bg-brand-soft/50 xs:px-5">
          <ArrowDownToLine size={15} />{secondaryLabel}
        </Link>
        {showPrimary && <Link href={primaryHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_rgba(241,90,34,.18)] transition hover:bg-orange-700 xs:px-5">
          <Plus size={15} />{primaryLabel}
        </Link>}
      </div>
    </header>
  );
}
